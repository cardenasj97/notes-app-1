import "server-only";

import { and, eq } from "drizzle-orm";
import OpenAI from "openai";

import { getDb, hasDatabaseConfig } from "@/db/client";
import { aiSummaryDrafts, auditEvents, noteVersions, notes } from "@/db/schema";
import { getOpenAiConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { aiSummarySchema, type AiSummary, type AiSummarySelection } from "@/lib/types";
import { recordAuditEvent } from "@/server/audit/service";

import { canGenerateSummary, canReadNote } from "./permissions";
import { canWriteNote } from "@/server/files/permissions";
import { acceptAiSummaryInputSchema, generateAiSummaryInputSchema } from "./types";

type AuthContext = {
  userId: string;
};

type SummaryPayload = AiSummary;

function getOpenAiClient() {
  const config = getOpenAiConfig();
  if (!config) {
    return null;
  }

  return new OpenAI({
    apiKey: config.apiKey,
  });
}

function selectSummaryParts(summary: SummaryPayload, selection: AiSummarySelection): SummaryPayload {
  return {
    overview: summary.overview,
    keyPoints: selection.keyPoints ? summary.keyPoints : [],
    actionItems: selection.actionItems ? summary.actionItems : [],
    openQuestions: selection.openQuestions ? summary.openQuestions : [],
  };
}

export async function generateAiSummary(input: { noteId: string; noteVersionId: string }, auth: AuthContext) {
  const parsed = generateAiSummaryInputSchema.parse(input);

  if (!(await canGenerateSummary(auth.userId, parsed.noteId, parsed.noteVersionId))) {
    throw new Error("Unauthorized to generate a summary for this note version.");
  }

  if (!hasDatabaseConfig()) {
    return {
      draftId: null,
      summary: {
        overview: "Summary generation requires database access.",
        keyPoints: [],
        actionItems: [],
        openQuestions: [],
      },
    };
  }

  const db = getDb();
  const [version] = await db
    .select({
      id: noteVersions.id,
      noteId: noteVersions.noteId,
      organizationId: noteVersions.organizationId,
      titleSnapshot: noteVersions.titleSnapshot,
      bodySnapshot: noteVersions.bodySnapshot,
      tagsSnapshot: noteVersions.tagsSnapshot,
      visibilitySnapshot: noteVersions.visibilitySnapshot,
    })
    .from(noteVersions)
    .where(and(eq(noteVersions.id, parsed.noteVersionId), eq(noteVersions.noteId, parsed.noteId)))
    .limit(1);

  if (!version) {
    throw new Error("Note version not found.");
  }

  const openAiClient = getOpenAiClient();
  const fallbackSummary: SummaryPayload = {
    overview: `Summary for ${version.titleSnapshot}`,
    keyPoints: [version.bodySnapshot.slice(0, 120).trim()].filter(Boolean),
    actionItems: [],
    openQuestions: [],
  };

  let generatedSummary: SummaryPayload = fallbackSummary;
  let model = "fallback";

  if (openAiClient) {
    const config = getOpenAiConfig();
    const response = await openAiClient.responses.create({
      model: config?.model ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "Return a compact JSON summary with overview, keyPoints, actionItems, and openQuestions arrays.",
        },
        {
          role: "user",
          content: `Title: ${version.titleSnapshot}\n\nBody:\n${version.bodySnapshot}\n\nTags: ${(version.tagsSnapshot ?? []).join(", ")}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "note_summary",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              overview: { type: "string" },
              keyPoints: { type: "array", items: { type: "string" } },
              actionItems: { type: "array", items: { type: "string" } },
              openQuestions: { type: "array", items: { type: "string" } },
            },
            required: ["overview", "keyPoints", "actionItems", "openQuestions"],
          },
        },
      },
    });

    const raw = response.output_text?.trim();
    if (raw) {
      generatedSummary = aiSummarySchema.parse(JSON.parse(raw));
      model = config?.model ?? "gpt-4.1-mini";
    }
  }

  const [draft] = await db
    .insert(aiSummaryDrafts)
    .values({
      organizationId: version.organizationId,
      noteId: version.noteId,
      noteVersionId: version.id,
      generatedBy: auth.userId,
      model,
      overview: generatedSummary.overview,
      keyPoints: generatedSummary.keyPoints,
      actionItems: generatedSummary.actionItems,
      openQuestions: generatedSummary.openQuestions,
      status: "draft",
    })
    .returning();

  await recordAuditEvent({
    organizationId: version.organizationId,
    actorId: auth.userId,
    eventType: "ai.summary.generated",
    entityType: "ai_summary_draft",
    entityId: draft.id,
    payload: {
      noteId: version.noteId,
      noteVersionId: version.id,
      model,
    },
  });

  logger.info("ai.summary.generated", {
    organizationId: version.organizationId,
    actorId: auth.userId,
    entityId: draft.id,
    noteId: version.noteId,
    noteVersionId: version.id,
  });

  return {
    draftId: draft.id,
    summary: generatedSummary,
  };
}

export async function acceptAiSummary(input: { draftId: string; selection: AiSummarySelection }, auth: AuthContext) {
  const parsed = acceptAiSummaryInputSchema.parse(input);

  if (!hasDatabaseConfig()) {
    return {
      accepted: false,
      reason: "Database access required.",
    };
  }

  const db = getDb();
  const [draft] = await db
    .select()
    .from(aiSummaryDrafts)
    .where(eq(aiSummaryDrafts.id, parsed.draftId))
    .limit(1);

  if (!draft) {
    throw new Error("Summary draft not found.");
  }

  if (!(await canWriteNote(auth.userId, draft.noteId))) {
    throw new Error("Only the note author can accept a summary.");
  }

  const [currentVersion] = await db
    .select({
      currentVersionNumber: notes.currentVersionNumber,
      acceptedSummary: notes.acceptedSummary,
      organizationId: notes.organizationId,
    })
    .from(notes)
    .where(eq(notes.id, draft.noteId))
    .limit(1);

  if (!currentVersion) {
    throw new Error("Note not found.");
  }

  const [sourceVersion] = await db
    .select()
    .from(noteVersions)
    .where(eq(noteVersions.id, draft.noteVersionId))
    .limit(1);

  if (!sourceVersion) {
    throw new Error("Source version not found.");
  }

  if (sourceVersion.versionNumber !== currentVersion.currentVersionNumber) {
    await db
      .update(aiSummaryDrafts)
      .set({ status: "stale", updatedAt: new Date() })
      .where(eq(aiSummaryDrafts.id, draft.id));

    return {
      accepted: false,
      reason: "The source version is no longer current.",
    };
  }

  const selectedSummary: SummaryPayload = selectSummaryParts(
    {
      overview: draft.overview,
      keyPoints: draft.keyPoints ?? [],
      actionItems: draft.actionItems ?? [],
      openQuestions: draft.openQuestions ?? [],
    },
    parsed.selection,
  );

  const nextVersionNumber = currentVersion.currentVersionNumber + 1;
  await db.transaction(async (tx) => {
    const [newVersion] = await tx
      .insert(noteVersions)
      .values({
        noteId: draft.noteId,
        organizationId: draft.organizationId,
        versionNumber: nextVersionNumber,
        editedBy: auth.userId,
        changeSource: "ai_summary_accept",
        changedFields: ["acceptedSummary"],
        titleSnapshot: sourceVersion.titleSnapshot,
        bodySnapshot: sourceVersion.bodySnapshot,
        visibilitySnapshot: sourceVersion.visibilitySnapshot,
        tagsSnapshot: sourceVersion.tagsSnapshot,
        sharedUserIdsSnapshot: sourceVersion.sharedUserIdsSnapshot,
        acceptedSummarySnapshot: selectedSummary,
      })
      .returning();

    await tx
      .update(notes)
      .set({
        currentVersionNumber: nextVersionNumber,
        acceptedSummary: selectedSummary,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, draft.noteId));

    await tx
      .update(aiSummaryDrafts)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(aiSummaryDrafts.id, draft.id));

    await tx.insert(auditEvents).values({
      organizationId: draft.organizationId,
      actorId: auth.userId,
      eventType: "ai.summary.accepted",
      entityType: "note_version",
      entityId: newVersion.id,
      payload: {
        noteId: draft.noteId,
        draftId: draft.id,
        selection: parsed.selection,
      },
    });
  });

  logger.info("ai.summary.accepted", {
    organizationId: draft.organizationId,
    actorId: auth.userId,
    entityId: draft.id,
    noteId: draft.noteId,
  });

  return {
    accepted: true,
  };
}
