import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq, inArray, isNull } from "drizzle-orm";

import { getDb, hasDatabaseConfig } from "@/db/client";
import {
  memberships,
  noteShares as noteSharesTable,
  noteTagLinks as noteTagLinksTable,
  notes as noteTable,
  noteVersions as noteVersionsTable,
  profiles as profilesTable,
  tags as tagsTable,
} from "@/db/schema";
import { logger } from "@/lib/logger";
import { normalizeTag, toSearchDocument, uniqueStrings } from "@/lib/utils";
import { recordAuditEvent } from "@/server/audit/service";
import { getAppShellContext } from "@/server/orgs/context";

import { compareVersionSnapshots, getChangedFields } from "./diff";
import {
  getDemoNoteById,
  getDemoStore,
  getDemoViewer,
  removeDemoNote,
  setDemoNote,
} from "./mock-data";
import { canManageSharing, canReadNote, canWriteNote, isOrganizationMember } from "./permissions";
import { buildListAccessibleNotesQuery } from "./queries";
import { noteFormSchema, noteSearchSchema, parseList } from "./validation";
import type {
  NoteDiff,
  NoteListItem,
  NoteRecord,
  NoteSearchResult,
  NoteVersionSummary,
  NotesViewer,
} from "./types";

type NoteAccessError = Error & { status?: number };
type DbClient = ReturnType<typeof getDb>;
type DbTransaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
type DbExecutor = DbClient | DbTransaction;

function accessError(message: string, status = 403): NoteAccessError {
  const error = new Error(message) as NoteAccessError;
  error.status = status;
  return error;
}

function makeBodyPreview(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 160);
}

function normalizeNoteTags(rawTags: string[]) {
  return uniqueStrings(rawTags.map(normalizeTag).filter(Boolean));
}

function buildSearchDocument(title: string, body: string, tags: string[]) {
  return toSearchDocument([title, body, tags.join(" ")]);
}

function scoreMatch(note: NoteRecord, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return 1;
  }

  const haystack = [note.title, note.body, note.tags.join(" ")].join(" ").toLowerCase();
  let score = 0;

  for (const token of normalized.split(/\s+/).filter(Boolean)) {
    if (note.title.toLowerCase().includes(token)) {
      score += 6;
    }
    if (note.tags.some((tag) => tag.toLowerCase().includes(token))) {
      score += 4;
    }
    if (haystack.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function noteToListItem(note: NoteRecord): NoteListItem {
  return {
    id: note.id,
    organizationId: note.organizationId,
    authorDisplayName: note.authorDisplayName,
    title: note.title,
    visibility: note.visibility,
    tags: note.tags,
    currentVersionNumber: note.currentVersionNumber,
    updatedAt: note.updatedAt,
    bodyPreview: makeBodyPreview(note.body),
    shareCount: note.sharedUsers.length,
  };
}

function noteToSearchResult(note: NoteRecord, score: number): NoteSearchResult {
  return {
    ...noteToListItem(note),
    score,
  };
}

function cloneNote(note: NoteRecord): NoteRecord {
  return {
    ...note,
    tags: [...note.tags],
    sharedUsers: note.sharedUsers.map((sharedUser) => ({ ...sharedUser })),
    versions: note.versions.map((version) => ({
      ...version,
      changedFields: [...version.changedFields],
      tagsSnapshot: [...version.tagsSnapshot],
      sharedUserIdsSnapshot: [...version.sharedUserIdsSnapshot],
      acceptedSummarySnapshot: version.acceptedSummarySnapshot
        ? { ...version.acceptedSummarySnapshot }
        : null,
    })),
    acceptedSummary: note.acceptedSummary ? { ...note.acceptedSummary } : null,
  };
}

function sortByUpdatedDesc(notes: NoteRecord[]) {
  return [...notes].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function assertOrganizationAccess(viewer: NotesViewer, organizationId: string) {
  if (!isOrganizationMember(viewer, organizationId)) {
    throw accessError("You do not belong to this organization.");
  }
}

function buildVersionSnapshot(note: NoteRecord, overrides: Partial<NoteVersionSummary> = {}): NoteVersionSummary {
  return {
    id: overrides.id ?? `${note.id}-v${overrides.versionNumber ?? note.currentVersionNumber}`,
    noteId: overrides.noteId ?? note.id,
    organizationId: overrides.organizationId ?? note.organizationId,
    versionNumber: overrides.versionNumber ?? note.currentVersionNumber,
    editedBy: overrides.editedBy ?? note.authorId,
    editedByDisplayName: overrides.editedByDisplayName ?? note.authorDisplayName,
    changeSource: overrides.changeSource ?? "manual_edit",
    changedFields: overrides.changedFields ?? [],
    titleSnapshot: overrides.titleSnapshot ?? note.title,
    bodySnapshot: overrides.bodySnapshot ?? note.body,
    visibilitySnapshot: overrides.visibilitySnapshot ?? note.visibility,
    tagsSnapshot: overrides.tagsSnapshot ?? note.tags,
    sharedUserIdsSnapshot:
      overrides.sharedUserIdsSnapshot ?? note.sharedUsers.map((sharedUser) => sharedUser.userId),
    acceptedSummarySnapshot: overrides.acceptedSummarySnapshot ?? note.acceptedSummary,
    createdAt: overrides.createdAt ?? note.updatedAt,
  };
}

function getDemoNotesForOrg(viewer: NotesViewer, organizationId: string) {
  const store = getDemoStore();

  return sortByUpdatedDesc(
    store.notes.filter((note) => note.organizationId === organizationId && canReadNote(viewer, note)),
  );
}

function getDemoNoteOrThrow(viewer: NotesViewer, noteId: string) {
  const note = getDemoNoteById(noteId);

  if (!note) {
    throw accessError("Note not found", 404);
  }

  if (!canReadNote(viewer, note)) {
    throw accessError("You do not have access to this note.");
  }

  return note;
}

async function filterOrganizationMemberIds(organizationId: string, userIds: string[]) {
  if (!userIds.length) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        inArray(memberships.userId, uniqueStrings(userIds)),
      ),
    );

  return rows.map((row) => row.userId);
}

async function syncNoteTags(tx: DbExecutor, organizationId: string, noteId: string, tagNames: string[]) {
  await tx.delete(noteTagLinksTable).where(eq(noteTagLinksTable.noteId, noteId));

  if (!tagNames.length) {
    return;
  }

  const existing = await tx
    .select({
      id: tagsTable.id,
      normalizedName: tagsTable.normalizedName,
    })
    .from(tagsTable)
    .where(
      and(
        eq(tagsTable.organizationId, organizationId),
        inArray(tagsTable.normalizedName, tagNames),
      ),
    );

  const tagIdsByName = new Map(existing.map((tag) => [tag.normalizedName, tag.id]));
  const missing = tagNames.filter((tagName) => !tagIdsByName.has(tagName));

  if (missing.length) {
    const inserted = await tx
      .insert(tagsTable)
      .values(
        missing.map((tagName) => ({
          id: randomUUID(),
          organizationId,
          name: tagName,
          normalizedName: tagName,
        })),
      )
      .returning({
        id: tagsTable.id,
        normalizedName: tagsTable.normalizedName,
      });

    for (const tag of inserted) {
      tagIdsByName.set(tag.normalizedName, tag.id);
    }
  }

  await tx.insert(noteTagLinksTable).values(
    tagNames.map((tagName) => ({
      noteId,
      tagId: tagIdsByName.get(tagName)!,
    })),
  );
}

async function replaceNoteShares(tx: DbExecutor, noteId: string, sharedUserIds: string[], grantedBy: string) {
  await tx.delete(noteSharesTable).where(eq(noteSharesTable.noteId, noteId));

  if (!sharedUserIds.length) {
    return;
  }

  await tx.insert(noteSharesTable).values(
    sharedUserIds.map((userId) => ({
      noteId,
      userId,
      grantedBy,
    })),
  );
}

async function loadDbNote(noteId: string) {
  const db = getDb();
  const [base] = await db
    .select({
      id: noteTable.id,
      organizationId: noteTable.organizationId,
      authorId: noteTable.authorId,
      authorDisplayName: profilesTable.displayName,
      authorEmail: profilesTable.email,
      title: noteTable.title,
      body: noteTable.body,
      visibility: noteTable.visibility,
      currentVersionNumber: noteTable.currentVersionNumber,
      acceptedSummary: noteTable.acceptedSummary,
      createdAt: noteTable.createdAt,
      updatedAt: noteTable.updatedAt,
      deletedAt: noteTable.deletedAt,
    })
    .from(noteTable)
    .innerJoin(profilesTable, eq(noteTable.authorId, profilesTable.id))
    .where(and(eq(noteTable.id, noteId), isNull(noteTable.deletedAt)))
    .limit(1);

  if (!base) {
    return null;
  }

  const [tagRows, shareRows, versionRows] = await Promise.all([
    db
      .select({ name: tagsTable.name })
      .from(noteTagLinksTable)
      .innerJoin(tagsTable, eq(noteTagLinksTable.tagId, tagsTable.id))
      .where(eq(noteTagLinksTable.noteId, noteId))
      .orderBy(tagsTable.name),
    db
      .select({
        userId: profilesTable.id,
        email: profilesTable.email,
        displayName: profilesTable.displayName,
      })
      .from(noteSharesTable)
      .innerJoin(profilesTable, eq(noteSharesTable.userId, profilesTable.id))
      .where(eq(noteSharesTable.noteId, noteId))
      .orderBy(profilesTable.displayName),
    db
      .select({
        id: noteVersionsTable.id,
        noteId: noteVersionsTable.noteId,
        organizationId: noteVersionsTable.organizationId,
        versionNumber: noteVersionsTable.versionNumber,
        editedBy: noteVersionsTable.editedBy,
        editedByDisplayName: profilesTable.displayName,
        changeSource: noteVersionsTable.changeSource,
        changedFields: noteVersionsTable.changedFields,
        titleSnapshot: noteVersionsTable.titleSnapshot,
        bodySnapshot: noteVersionsTable.bodySnapshot,
        visibilitySnapshot: noteVersionsTable.visibilitySnapshot,
        tagsSnapshot: noteVersionsTable.tagsSnapshot,
        sharedUserIdsSnapshot: noteVersionsTable.sharedUserIdsSnapshot,
        acceptedSummarySnapshot: noteVersionsTable.acceptedSummarySnapshot,
        createdAt: noteVersionsTable.createdAt,
      })
      .from(noteVersionsTable)
      .innerJoin(profilesTable, eq(noteVersionsTable.editedBy, profilesTable.id))
      .where(eq(noteVersionsTable.noteId, noteId))
      .orderBy(noteVersionsTable.versionNumber),
  ]);

  return {
    id: base.id,
    organizationId: base.organizationId,
    authorId: base.authorId,
    authorDisplayName: base.authorDisplayName,
    authorEmail: base.authorEmail,
    title: base.title,
    body: base.body,
    visibility: base.visibility,
    tags: tagRows.map((row) => row.name),
    sharedUsers: shareRows,
    currentVersionNumber: base.currentVersionNumber,
    acceptedSummary: base.acceptedSummary,
    createdAt: base.createdAt.toISOString(),
    updatedAt: base.updatedAt.toISOString(),
    deletedAt: base.deletedAt ? base.deletedAt.toISOString() : null,
    versions: versionRows.map((version) => ({
      ...version,
      editedByDisplayName: version.editedByDisplayName,
      changedFields: version.changedFields ?? [],
      tagsSnapshot: version.tagsSnapshot ?? [],
      sharedUserIdsSnapshot: version.sharedUserIdsSnapshot ?? [],
      acceptedSummarySnapshot: version.acceptedSummarySnapshot ?? null,
      createdAt: version.createdAt.toISOString(),
    })),
  } satisfies NoteRecord;
}

export async function getActiveNotesViewer(): Promise<NotesViewer> {
  if (!hasDatabaseConfig()) {
    return getDemoViewer();
  }

  const context = await getAppShellContext();

  return {
    userId: context.profile.id,
    displayName: context.profile.displayName,
    email: context.profile.email,
    activeOrganizationId: context.activeOrganization?.id ?? null,
    organizationIds: context.organizations.map((organization) => organization.id),
    roleByOrganizationId: Object.fromEntries(
      context.organizations.map((organization) => [organization.id, organization.role]),
    ),
  };
}

export async function listAccessibleNotes(organizationId: string, query = "") {
  const viewer = await getActiveNotesViewer();
  assertOrganizationAccess(viewer, organizationId);

  if (!hasDatabaseConfig()) {
    const notes = getDemoNotesForOrg(viewer, organizationId);
    const search = noteSearchSchema.parse({ q: query }).q;
    const filtered = search
      ? notes.filter((note) =>
          [note.title, note.body, note.tags.join(" ")].join(" ").toLowerCase().includes(search.toLowerCase()),
        )
      : notes;

    return filtered.map(noteToListItem);
  }

  const db = getDb();
  const search = noteSearchSchema.parse({ q: query }).q;
  const rows = await buildListAccessibleNotesQuery(db, {
    organizationId,
    userId: viewer.userId,
    search,
  });

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    authorDisplayName: row.authorDisplayName,
    title: row.title,
    visibility: row.visibility,
    tags: row.tags ?? [],
    currentVersionNumber: row.currentVersionNumber,
    updatedAt: row.updatedAt.toISOString(),
    bodyPreview: makeBodyPreview(row.body),
    shareCount: Number(row.shareCount),
  }));
}

export async function searchAccessibleNotes(organizationId: string, query = "") {
  const viewer = await getActiveNotesViewer();
  assertOrganizationAccess(viewer, organizationId);

  if (!hasDatabaseConfig()) {
    const notes = getDemoNotesForOrg(viewer, organizationId);
    const search = noteSearchSchema.parse({ q: query }).q;
    return notes
      .map((note) => noteToSearchResult(note, scoreMatch(note, search)))
      .filter((note) => note.score > 0)
      .sort((left, right) => right.score - left.score || right.updatedAt.localeCompare(left.updatedAt));
  }

  const noteItems = await listAccessibleNotes(organizationId, query);
  const search = noteSearchSchema.parse({ q: query }).q;

  return noteItems.map((note) => ({
    ...note,
    score: search
      ? Number(note.title.toLowerCase().includes(search.toLowerCase())) + Number(note.tags.join(" ").includes(search))
      : 0,
  }));
}

export async function getNoteDetail(noteId: string) {
  const viewer = await getActiveNotesViewer();

  if (!hasDatabaseConfig()) {
    return cloneNote(getDemoNoteOrThrow(viewer, noteId));
  }

  const note = await loadDbNote(noteId);

  if (!note) {
    throw accessError("Note not found", 404);
  }

  if (!canReadNote(viewer, note)) {
    throw accessError("You do not have access to this note.");
  }

  return cloneNote(note);
}

export async function getNoteHistory(noteId: string) {
  const note = await getNoteDetail(noteId);
  return [...note.versions].sort((left, right) => right.versionNumber - left.versionNumber);
}

export async function getNoteVersionDiff(noteId: string, fromVersionNumber: number, toVersionNumber: number) {
  const note = await getNoteDetail(noteId);
  const previous = note.versions.find((version) => version.versionNumber === fromVersionNumber);
  const current = note.versions.find((version) => version.versionNumber === toVersionNumber);

  if (!previous || !current) {
    throw accessError("Version not found", 404);
  }

  return compareVersionSnapshots(previous, current);
}

export async function createNote(organizationId: string, formData: FormData) {
  const viewer = await getActiveNotesViewer();
  assertOrganizationAccess(viewer, organizationId);

  const parsed = noteFormSchema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
    visibility: formData.get("visibility"),
    tags: formData.get("tags"),
    sharedUserIds: formData.get("sharedUserIds"),
  });

  const tags = normalizeNoteTags(parseList(parsed.tags));
  const candidateSharedUserIds = uniqueStrings(parseList(parsed.sharedUserIds));
  const sharedUserIds =
    parsed.visibility === "shared"
      ? (await filterOrganizationMemberIds(organizationId, candidateSharedUserIds)).filter(
          (userId) => userId !== viewer.userId,
        )
      : [];

  const noteId = randomUUID();
  const versionId = randomUUID();
  const now = new Date();
  const nowIso = now.toISOString();

  const nextVersion = {
    id: versionId,
    noteId,
    organizationId,
    versionNumber: 1,
    editedBy: viewer.userId,
    editedByDisplayName: viewer.displayName,
    changeSource: "manual_edit" as const,
    changedFields: ["title", "body", "visibility", "tags", ...(sharedUserIds.length ? ["shares"] : [])],
    titleSnapshot: parsed.title,
    bodySnapshot: parsed.body,
    visibilitySnapshot: parsed.visibility,
    tagsSnapshot: tags,
    sharedUserIdsSnapshot: sharedUserIds,
    acceptedSummarySnapshot: null,
    createdAt: nowIso,
  };

  if (!hasDatabaseConfig()) {
    const sharedUsers = getDemoStore()
      .profiles.filter((profile) => sharedUserIds.includes(profile.id))
      .map((profile) => ({
        userId: profile.id,
        email: profile.email,
        displayName: profile.displayName,
      }));

    const note: NoteRecord = {
      id: noteId,
      organizationId,
      authorId: viewer.userId,
      authorDisplayName: viewer.displayName,
      authorEmail: viewer.email,
      title: parsed.title,
      body: parsed.body,
      visibility: parsed.visibility,
      tags,
      sharedUsers,
      currentVersionNumber: 1,
      acceptedSummary: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
      versions: [nextVersion],
    };

    setDemoNote(note);
    logger.info("note.create", { noteId, organizationId, authorId: viewer.userId });
    return note;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(noteTable).values({
      id: noteId,
      organizationId,
      authorId: viewer.userId,
      title: parsed.title,
      body: parsed.body,
      visibility: parsed.visibility,
      currentVersionNumber: 1,
      acceptedSummary: null,
      searchDocument: buildSearchDocument(parsed.title, parsed.body, tags),
      createdAt: now,
      updatedAt: now,
    });

    await syncNoteTags(tx, organizationId, noteId, tags);
    await replaceNoteShares(tx, noteId, sharedUserIds, viewer.userId);
    await tx.insert(noteVersionsTable).values({
      id: versionId,
      noteId,
      organizationId,
      versionNumber: 1,
      editedBy: viewer.userId,
      changeSource: "manual_edit",
      changedFields: nextVersion.changedFields,
      titleSnapshot: parsed.title,
      bodySnapshot: parsed.body,
      visibilitySnapshot: parsed.visibility,
      tagsSnapshot: tags,
      sharedUserIdsSnapshot: sharedUserIds,
      acceptedSummarySnapshot: null,
      createdAt: now,
    });
  });

  await recordAuditEvent({
    organizationId,
    actorId: viewer.userId,
    eventType: "note.create",
    entityType: "note",
    entityId: noteId,
    payload: {
      visibility: parsed.visibility,
      tags,
      sharedUserIds,
    },
  });

  return getNoteDetail(noteId);
}

export async function updateNote(noteId: string, formData: FormData) {
  const viewer = await getActiveNotesViewer();
  const existing = await getNoteDetail(noteId);

  if (!canWriteNote(viewer, existing)) {
    throw accessError("Only the author can edit this note.");
  }

  const parsed = noteFormSchema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
    visibility: formData.get("visibility"),
    tags: formData.get("tags"),
    sharedUserIds: formData.get("sharedUserIds"),
  });

  const tags = normalizeNoteTags(parseList(parsed.tags));
  const candidateSharedUserIds = uniqueStrings(parseList(parsed.sharedUserIds));
  const sharedUserIds =
    parsed.visibility === "shared"
      ? (await filterOrganizationMemberIds(existing.organizationId, candidateSharedUserIds)).filter(
          (userId) => userId !== viewer.userId,
        )
      : [];

  const nextVersionNumber = existing.currentVersionNumber + 1;
  const now = new Date();
  const nowIso = now.toISOString();
  const previousVersion = existing.versions.find((version) => version.versionNumber === existing.currentVersionNumber)
    ?? existing.versions[existing.versions.length - 1];
  const nextSnapshot = buildVersionSnapshot(existing, {
    versionNumber: nextVersionNumber,
    editedBy: viewer.userId,
    editedByDisplayName: viewer.displayName,
    changeSource: "manual_edit",
    titleSnapshot: parsed.title,
    bodySnapshot: parsed.body,
    visibilitySnapshot: parsed.visibility,
    tagsSnapshot: tags,
    sharedUserIdsSnapshot: sharedUserIds,
    acceptedSummarySnapshot: existing.acceptedSummary,
    createdAt: nowIso,
  });
  const changedFields = getChangedFields(previousVersion, nextSnapshot);

  if (!hasDatabaseConfig()) {
    const sharedUsers = getDemoStore()
      .profiles.filter((profile) => sharedUserIds.includes(profile.id))
      .map((profile) => ({
        userId: profile.id,
        email: profile.email,
        displayName: profile.displayName,
      }));

    const updated: NoteRecord = {
      ...existing,
      title: parsed.title,
      body: parsed.body,
      visibility: parsed.visibility,
      tags,
      sharedUsers,
      currentVersionNumber: nextVersionNumber,
      updatedAt: nowIso,
      versions: [
        ...existing.versions,
        {
          ...nextSnapshot,
          id: `${noteId}-v${nextVersionNumber}`,
          changedFields,
        },
      ],
    };

    setDemoNote(updated);
    logger.info("note.update", { noteId, organizationId: existing.organizationId, actorId: viewer.userId });
    return updated;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(noteTable)
      .set({
        title: parsed.title,
        body: parsed.body,
        visibility: parsed.visibility,
        currentVersionNumber: nextVersionNumber,
        acceptedSummary: existing.acceptedSummary,
        searchDocument: buildSearchDocument(parsed.title, parsed.body, tags),
        updatedAt: now,
      })
      .where(eq(noteTable.id, noteId));

    await syncNoteTags(tx, existing.organizationId, noteId, tags);
    await replaceNoteShares(tx, noteId, sharedUserIds, viewer.userId);
    await tx.insert(noteVersionsTable).values({
      id: randomUUID(),
      noteId,
      organizationId: existing.organizationId,
      versionNumber: nextVersionNumber,
      editedBy: viewer.userId,
      changeSource: "manual_edit",
      changedFields,
      titleSnapshot: parsed.title,
      bodySnapshot: parsed.body,
      visibilitySnapshot: parsed.visibility,
      tagsSnapshot: tags,
      sharedUserIdsSnapshot: sharedUserIds,
      acceptedSummarySnapshot: existing.acceptedSummary,
      createdAt: now,
    });
  });

  await recordAuditEvent({
    organizationId: existing.organizationId,
    actorId: viewer.userId,
    eventType: "note.update",
    entityType: "note",
    entityId: noteId,
    payload: { changedFields },
  });

  return getNoteDetail(noteId);
}

export async function deleteNote(noteId: string) {
  const viewer = await getActiveNotesViewer();
  const note = await getNoteDetail(noteId);

  if (!canWriteNote(viewer, note)) {
    throw accessError("Only the author can delete this note.");
  }

  if (!hasDatabaseConfig()) {
    removeDemoNote(noteId);
    logger.info("note.delete", { noteId, organizationId: note.organizationId, actorId: viewer.userId });
    return;
  }

  const db = getDb();
  await db.update(noteTable).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(noteTable.id, noteId));

  await recordAuditEvent({
    organizationId: note.organizationId,
    actorId: viewer.userId,
    eventType: "note.delete",
    entityType: "note",
    entityId: noteId,
  });
}

export async function getOrganizationNotes(organizationId: string, query = "") {
  return listAccessibleNotes(organizationId, query);
}

export async function getNoteSearchResults(organizationId: string, query = "") {
  return searchAccessibleNotes(organizationId, query);
}

export async function shareNoteWithUsers(noteId: string, sharedUserIds: string[]) {
  const viewer = await getActiveNotesViewer();
  const note = await getNoteDetail(noteId);

  if (!canManageSharing(viewer, note)) {
    throw accessError("Only the author can update sharing.");
  }

  const nextSharedUserIds = (await filterOrganizationMemberIds(note.organizationId, sharedUserIds)).filter(
    (userId) => userId !== viewer.userId,
  );
  const nextVisibility = nextSharedUserIds.length ? "shared" : note.visibility;
  const nextVersionNumber = note.currentVersionNumber + 1;
  const now = new Date();
  const nowIso = now.toISOString();
  const previousVersion = note.versions.find((version) => version.versionNumber === note.currentVersionNumber)
    ?? note.versions[note.versions.length - 1];
  const nextSnapshot = buildVersionSnapshot(note, {
    versionNumber: nextVersionNumber,
    editedBy: viewer.userId,
    editedByDisplayName: viewer.displayName,
    titleSnapshot: note.title,
    bodySnapshot: note.body,
    visibilitySnapshot: nextVisibility,
    tagsSnapshot: note.tags,
    sharedUserIdsSnapshot: nextSharedUserIds,
    acceptedSummarySnapshot: note.acceptedSummary,
    createdAt: nowIso,
  });
  const changedFields = getChangedFields(previousVersion, nextSnapshot);

  if (!hasDatabaseConfig()) {
    const sharedUsers = getDemoStore()
      .profiles.filter((profile) => nextSharedUserIds.includes(profile.id))
      .map((profile) => ({
        userId: profile.id,
        email: profile.email,
        displayName: profile.displayName,
      }));

    const updated: NoteRecord = {
      ...note,
      visibility: nextVisibility,
      sharedUsers,
      currentVersionNumber: nextVersionNumber,
      updatedAt: nowIso,
      versions: [
        ...note.versions,
        {
          ...nextSnapshot,
          id: `${note.id}-v${nextVersionNumber}`,
          changeSource: "manual_edit",
          changedFields,
        },
      ],
    };

    setDemoNote(updated);
    return updated;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await replaceNoteShares(tx, noteId, nextSharedUserIds, viewer.userId);
    await tx
      .update(noteTable)
      .set({
        visibility: nextVisibility,
        currentVersionNumber: nextVersionNumber,
        updatedAt: now,
      })
      .where(eq(noteTable.id, noteId));
    await tx.insert(noteVersionsTable).values({
      id: randomUUID(),
      noteId,
      organizationId: note.organizationId,
      versionNumber: nextVersionNumber,
      editedBy: viewer.userId,
      changeSource: "manual_edit",
      changedFields,
      titleSnapshot: note.title,
      bodySnapshot: note.body,
      visibilitySnapshot: nextVisibility,
      tagsSnapshot: note.tags,
      sharedUserIdsSnapshot: nextSharedUserIds,
      acceptedSummarySnapshot: note.acceptedSummary,
      createdAt: now,
    });
  });

  await recordAuditEvent({
    organizationId: note.organizationId,
    actorId: viewer.userId,
    eventType: "note.share_updated",
    entityType: "note",
    entityId: noteId,
    payload: { sharedUserIds: nextSharedUserIds },
  });

  return getNoteDetail(noteId);
}

export async function getNoteDiff(noteId: string, fromVersionNumber: number, toVersionNumber: number): Promise<NoteDiff> {
  return getNoteVersionDiff(noteId, fromVersionNumber, toVersionNumber);
}

export async function getNoteForEdit(noteId: string) {
  return getNoteDetail(noteId);
}

export async function buildNewNoteVersionFromSummary(noteId: string, selectedSummary: string) {
  const viewer = await getActiveNotesViewer();
  const note = await getNoteDetail(noteId);

  if (!canWriteNote(viewer, note)) {
    throw accessError("Only the author can accept AI changes.");
  }

  const nextVersionNumber = note.currentVersionNumber + 1;
  const now = new Date();
  const nowIso = now.toISOString();
  const selected = note.acceptedSummary
    ? {
        ...note.acceptedSummary,
        overview: selectedSummary,
      }
    : null;

  if (!hasDatabaseConfig()) {
    const updated: NoteRecord = {
      ...note,
      acceptedSummary: selected,
      currentVersionNumber: nextVersionNumber,
      updatedAt: nowIso,
      versions: [
        ...note.versions,
        {
          id: `${note.id}-v${nextVersionNumber}`,
          noteId: note.id,
          organizationId: note.organizationId,
          versionNumber: nextVersionNumber,
          editedBy: viewer.userId,
          editedByDisplayName: viewer.displayName,
          changeSource: "ai_summary_accept",
          changedFields: ["summary"],
          titleSnapshot: note.title,
          bodySnapshot: note.body,
          visibilitySnapshot: note.visibility,
          tagsSnapshot: note.tags,
          sharedUserIdsSnapshot: note.sharedUsers.map((sharedUser) => sharedUser.userId),
          acceptedSummarySnapshot: selected,
          createdAt: nowIso,
        },
      ],
    };

    setDemoNote(updated);
    return updated;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(noteTable)
      .set({
        acceptedSummary: selected,
        currentVersionNumber: nextVersionNumber,
        updatedAt: now,
      })
      .where(eq(noteTable.id, note.id));

    await tx.insert(noteVersionsTable).values({
      id: randomUUID(),
      noteId: note.id,
      organizationId: note.organizationId,
      versionNumber: nextVersionNumber,
      editedBy: viewer.userId,
      changeSource: "ai_summary_accept",
      changedFields: ["summary"],
      titleSnapshot: note.title,
      bodySnapshot: note.body,
      visibilitySnapshot: note.visibility,
      tagsSnapshot: note.tags,
      sharedUserIdsSnapshot: note.sharedUsers.map((sharedUser) => sharedUser.userId),
      acceptedSummarySnapshot: selected,
      createdAt: now,
    });
  });

  await recordAuditEvent({
    organizationId: note.organizationId,
    actorId: viewer.userId,
    eventType: "note.summary_applied",
    entityType: "note",
    entityId: note.id,
    payload: { selectedSummary },
  });

  return getNoteDetail(noteId);
}
