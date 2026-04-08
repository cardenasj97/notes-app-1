import { randomUUID } from "node:crypto";

import type { AiSummary } from "@/lib/types";
import { logger } from "@/lib/logger";
import { getStorageBucketName } from "@/lib/env";
import { normalizeTag, slugify, toSearchDocument } from "@/lib/utils";
import { createSupabaseServiceClient } from "@/server/supabase/service";

import { getDb } from "./client";
import {
  aiSummaryDrafts,
  auditEvents,
  files,
  memberships,
  noteShares,
  noteTagLinks,
  notes,
  noteVersions,
  organizations,
  profiles,
  tags,
  type NoteVisibility,
  type OrganizationRole,
} from "./schema";

type SeedUser = {
  displayName: string;
  email: string;
  password: string;
};

type SeedOrg = {
  name: string;
  slug: string;
  members: Array<{ email: string; role: OrganizationRole }>;
};

const seedUsers: SeedUser[] = [
  {
    displayName: "Avery Flores",
    email: "avery@notes-app-1.local",
    password: "NotesApp1!Avery",
  },
  {
    displayName: "Mina Patel",
    email: "mina@notes-app-1.local",
    password: "NotesApp1!Mina",
  },
  {
    displayName: "Leo Santos",
    email: "leo@notes-app-1.local",
    password: "NotesApp1!Leo",
  },
  {
    displayName: "Nadia Kim",
    email: "nadia@notes-app-1.local",
    password: "NotesApp1!Nadia",
  },
  {
    displayName: "Priya Bose",
    email: "priya@notes-app-1.local",
    password: "NotesApp1!Priya",
  },
  {
    displayName: "Owen Garcia",
    email: "owen@notes-app-1.local",
    password: "NotesApp1!Owen",
  },
];

const seedOrganizations: SeedOrg[] = [
  {
    name: "Northwind Research",
    slug: "northwind-research",
    members: [
      { email: "avery@notes-app-1.local", role: "owner" },
      { email: "mina@notes-app-1.local", role: "admin" },
      { email: "leo@notes-app-1.local", role: "member" },
      { email: "priya@notes-app-1.local", role: "member" },
    ],
  },
  {
    name: "Helio Product Studio",
    slug: "helio-product-studio",
    members: [
      { email: "nadia@notes-app-1.local", role: "owner" },
      { email: "avery@notes-app-1.local", role: "admin" },
      { email: "owen@notes-app-1.local", role: "member" },
      { email: "priya@notes-app-1.local", role: "member" },
    ],
  },
  {
    name: "Signal Works",
    slug: "signal-works",
    members: [
      { email: "leo@notes-app-1.local", role: "owner" },
      { email: "nadia@notes-app-1.local", role: "admin" },
      { email: "mina@notes-app-1.local", role: "member" },
      { email: "owen@notes-app-1.local", role: "member" },
    ],
  },
];

const sharedTags = [
  "roadmap",
  "retrospective",
  "launch",
  "security",
  "research",
  "ops",
  "customer",
  "handoff",
  "performance",
  "incident",
];

const orgSpecificTags: Record<string, string[]> = {
  "northwind-research": ["experiments", "lab", "field-study", "grant", "paper"],
  "helio-product-studio": ["design", "sprint", "prototype", "ux", "planning"],
  "signal-works": ["pipeline", "integration", "platform", "api", "release"],
};

const repeatingPhrases = [
  "migration plan",
  "search ranking",
  "tenant boundary",
  "design review",
  "launch checklist",
  "ops handoff",
  "incident response",
  "editor workflow",
  "summary review",
  "permissions audit",
];

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function makeSummary(title: string, orgName: string, tagsForNote: string[]): AiSummary {
  return {
    overview: `${title} captures the current state of work for ${orgName}.`,
    keyPoints: [
      `Tracks ${tagsForNote[0] ?? "project"} work inside the organization boundary.`,
      `Uses overlapping phrasing so search and permissions can be reviewed together.`,
    ],
    actionItems: [
      `Validate the next update for ${tagsForNote[1] ?? "operations"}.`,
      "Review visibility and sharing before publishing changes.",
    ],
    openQuestions: ["Should this note stay at org visibility or move to shared?"],
  };
}

async function ensureUsers() {
  const serviceClient = createSupabaseServiceClient();
  const existingUsersByEmail = new Map<string, string>();

  if (serviceClient) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (user.email) {
        existingUsersByEmail.set(user.email, user.id);
      }
    }
  }

  const userIds = new Map<string, string>();

  for (const user of seedUsers) {
    if (existingUsersByEmail.has(user.email)) {
      userIds.set(user.email, existingUsersByEmail.get(user.email)!);
      continue;
    }

    if (!serviceClient) {
      userIds.set(user.email, randomUUID());
      continue;
    }

    const { data, error } = await serviceClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        display_name: user.displayName,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error(`Unable to create auth user for ${user.email}`);
    }

    userIds.set(user.email, data.user.id);
  }

  return userIds;
}

async function resetDatabase() {
  const db = getDb();
  await db.delete(auditEvents);
  await db.delete(aiSummaryDrafts);
  await db.delete(files);
  await db.delete(noteShares);
  await db.delete(noteTagLinks);
  await db.delete(noteVersions);
  await db.delete(notes);
  await db.delete(tags);
  await db.delete(memberships);
  await db.delete(organizations);
  await db.delete(profiles);
}

async function ensureStorageBucket() {
  const serviceClient = createSupabaseServiceClient();
  const bucket = getStorageBucketName();

  if (!serviceClient) {
    return;
  }

  const { data, error } = await serviceClient.storage.listBuckets();

  if (error) {
    throw error;
  }

  const exists = (data ?? []).some((item) => item.id === bucket || item.name === bucket);

  if (exists) {
    return;
  }

  const { error: createError } = await serviceClient.storage.createBucket(bucket, {
    public: false,
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
}

async function uploadSeedFiles() {
  const serviceClient = createSupabaseServiceClient();
  const bucket = getStorageBucketName();

  if (!serviceClient) {
    return new Map<string, string>();
  }

  const uploaded = new Map<string, string>();

  for (const org of seedOrganizations) {
    const baseKey = `${org.slug}/seed/${slugify(org.name)}.txt`;
    const content = Buffer.from(
      `Seed file for ${org.name}\nThis file exists so reviewers can test org-level downloads.\n`,
      "utf8",
    );

    const { error } = await serviceClient.storage.from(bucket).upload(baseKey, content, {
      contentType: "text/plain",
      upsert: true,
    });

    if (error) {
      throw error;
    }

    uploaded.set(org.slug, baseKey);
  }

  return uploaded;
}

async function main() {
  logger.info("seed.start", { target: "notes-app-1" });

  const db = getDb();
  await ensureStorageBucket();
  const userIds = await ensureUsers();
  await resetDatabase();

  const profileRows = seedUsers.map((user) => ({
    id: userIds.get(user.email)!,
    email: user.email,
    displayName: user.displayName,
  }));

  await db.insert(profiles).values(profileRows);

  const organizationRows = seedOrganizations.map((organization, index) => {
    const ownerEmail = organization.members.find((member) => member.role === "owner")!.email;

    return {
      id: randomUUID(),
      name: organization.name,
      slug: organization.slug,
      createdBy: userIds.get(ownerEmail)!,
      createdAt: new Date(Date.now() - index * 86_400_000),
      updatedAt: new Date(),
    };
  });

  await db.insert(organizations).values(organizationRows);

  const orgIdBySlug = new Map(organizationRows.map((organization) => [organization.slug, organization.id]));
  const orgNameBySlug = new Map(organizationRows.map((organization) => [organization.slug, organization.name]));

  await db.insert(memberships).values(
    seedOrganizations.flatMap((organization) =>
      organization.members.map((member) => ({
        organizationId: orgIdBySlug.get(organization.slug)!,
        userId: userIds.get(member.email)!,
        role: member.role,
      })),
    ),
  );

  const tagRows = seedOrganizations.flatMap((organization) =>
    Array.from(new Set([...sharedTags, ...orgSpecificTags[organization.slug]])).map((tagName) => ({
      id: randomUUID(),
      organizationId: orgIdBySlug.get(organization.slug)!,
      name: tagName,
      normalizedName: normalizeTag(tagName),
    })),
  );

  await db.insert(tags).values(tagRows);

  const tagIdsByOrgAndName = new Map<string, string>();
  for (const tag of tagRows) {
    tagIdsByOrgAndName.set(`${tag.organizationId}:${tag.normalizedName}`, tag.id);
  }

  const fileKeysByOrg = await uploadSeedFiles();

  const fileRows: Array<typeof files.$inferInsert> = [];
  const noteRows: Array<typeof notes.$inferInsert> = [];
  const noteVersionRows: Array<typeof noteVersions.$inferInsert> = [];
  const noteTagRows: Array<typeof noteTagLinks.$inferInsert> = [];
  const noteShareRows: Array<typeof noteShares.$inferInsert> = [];
  const aiDraftRows: Array<typeof aiSummaryDrafts.$inferInsert> = [];

  const notesPerOrg = 3_334;

  for (const organization of seedOrganizations) {
    const organizationId = orgIdBySlug.get(organization.slug)!;
    const organizationName = orgNameBySlug.get(organization.slug)!;
    const memberIds = organization.members.map((member) => userIds.get(member.email)!);
    const localTags = [...sharedTags, ...orgSpecificTags[organization.slug]];

    const orgFileKey = fileKeysByOrg.get(organization.slug);
    if (orgFileKey) {
      fileRows.push({
        id: randomUUID(),
        organizationId,
        noteId: null,
        uploadedBy: memberIds[0],
        bucket: getStorageBucketName(),
        storageKey: orgFileKey,
        originalName: `${organization.slug}-seed.txt`,
        mimeType: "text/plain",
        sizeBytes: 96,
      });
    }

    for (let index = 0; index < notesPerOrg; index += 1) {
      const noteId = randomUUID();
      const authorId = memberIds[index % memberIds.length];
      const visibility: NoteVisibility =
        index % 9 === 0 ? "private" : index % 4 === 0 ? "shared" : "org";
      const title = `${organizationName} ${repeatingPhrases[index % repeatingPhrases.length]} ${index + 1}`;
      const tagNames = Array.from(
        new Set([
          localTags[index % localTags.length],
          localTags[(index + 2) % localTags.length],
          sharedTags[(index + 4) % sharedTags.length],
        ]),
      );

      const baseBody = [
        `# ${title}`,
        "",
        `This note belongs to ${organizationName} and is authored by ${seedUsers.find((user) => userIds.get(user.email) === authorId)?.displayName ?? "a teammate"}.`,
        "",
        `Focus area: ${repeatingPhrases[(index + 1) % repeatingPhrases.length]}.`,
        `Search phrase: ${repeatingPhrases[(index + 3) % repeatingPhrases.length]}.`,
        "",
        "## Decisions",
        "- Keep the implementation simple and permission-safe.",
        "- Store Markdown snapshots for diffs and version history.",
        "",
        "## Next steps",
        "- Review selective sharing rules.",
        "- Confirm file access stays scoped to this org.",
      ].join("\n");

      const versionCount = index % 5 === 0 ? 3 : index % 2 === 0 ? 2 : 1;
      const shareIds =
        visibility === "shared"
          ? memberIds.filter((memberId) => memberId !== authorId).slice(0, 1 + (index % 2))
          : [];

      let latestSummary: AiSummary | null = null;

      for (let versionNumber = 1; versionNumber <= versionCount; versionNumber += 1) {
        const versionId = randomUUID();
        const versionTags = versionNumber === versionCount ? tagNames : tagNames.slice(0, 2);
        const versionBody =
          versionNumber === 1
            ? baseBody
            : `${baseBody}\n\n## Revision ${versionNumber}\n- Updated after internal review.\n- Added more detail for ${versionTags[0]}.`;
        const summary =
          versionNumber === versionCount && index % 7 === 0
            ? makeSummary(title, organizationName, versionTags)
            : null;

        latestSummary = summary;

        noteVersionRows.push({
          id: versionId,
          noteId,
          organizationId,
          versionNumber,
          editedBy: versionNumber === 1 ? authorId : memberIds[(index + versionNumber) % memberIds.length],
          changeSource: versionNumber === versionCount && summary ? "ai_summary_accept" : "manual_edit",
          changedFields:
            versionNumber === 1
              ? ["title", "body", "visibility", "tags"]
              : summary
                ? ["acceptedSummary"]
                : ["body", "tags"],
          titleSnapshot: title,
          bodySnapshot: versionBody,
          visibilitySnapshot: visibility,
          tagsSnapshot: versionTags,
          sharedUserIdsSnapshot: shareIds,
          acceptedSummarySnapshot: summary,
        });

        if (versionNumber === versionCount && index % 11 === 0) {
          aiDraftRows.push({
            id: randomUUID(),
            organizationId,
            noteId,
            noteVersionId: versionId,
            generatedBy: authorId,
            model: "seed-model",
            overview: `Draft summary for ${title}.`,
            keyPoints: [`Covers ${versionTags[0]}.`, `Belongs to ${organizationName}.`],
            actionItems: ["Review the current version", "Confirm visibility before sharing"],
            openQuestions: ["Is the note ready for wider review?"],
            status: "draft",
          });
        }
      }

      noteRows.push({
        id: noteId,
        organizationId,
        authorId,
        title,
        body:
          versionCount > 1
            ? `${baseBody}\n\n## Revision ${versionCount}\n- Updated after internal review.\n- Added more detail for ${tagNames[0]}.`
            : baseBody,
        visibility,
        currentVersionNumber: versionCount,
        acceptedSummary: latestSummary,
        searchDocument: toSearchDocument([title, baseBody, ...tagNames]),
      });

      for (const tagName of tagNames) {
        noteTagRows.push({
          noteId,
          tagId: tagIdsByOrgAndName.get(`${organizationId}:${normalizeTag(tagName)}`)!,
        });
      }

      for (const shareId of shareIds) {
        noteShareRows.push({
          noteId,
          userId: shareId,
          grantedBy: authorId,
        });
      }

      if (index < 3) {
        const storageKey = `${organization.slug}/seed/note-${index + 1}.txt`;
        fileRows.push({
          id: randomUUID(),
          organizationId,
          noteId,
          uploadedBy: authorId,
          bucket: getStorageBucketName(),
          storageKey,
          originalName: `note-${index + 1}.txt`,
          mimeType: "text/plain",
          sizeBytes: 120,
        });
      }
    }
  }

  for (const batch of chunk(noteRows, 400)) {
    await db.insert(notes).values(batch);
  }

  for (const batch of chunk(noteVersionRows, 500)) {
    await db.insert(noteVersions).values(batch);
  }

  for (const batch of chunk(noteTagRows, 1_000)) {
    await db.insert(noteTagLinks).values(batch);
  }

  for (const batch of chunk(noteShareRows, 1_000)) {
    await db.insert(noteShares).values(batch);
  }

  for (const batch of chunk(fileRows, 200)) {
    await db.insert(files).values(batch);
  }

  for (const batch of chunk(aiDraftRows, 200)) {
    await db.insert(aiSummaryDrafts).values(batch);
  }

  logger.info("seed.complete", {
    users: seedUsers.length,
    organizations: seedOrganizations.length,
    notes: noteRows.length,
    versions: noteVersionRows.length,
    shares: noteShareRows.length,
    files: fileRows.length,
  });
}

void main().catch((error) => {
  logger.error("seed.failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
