import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getDb, hasDatabaseConfig } from "@/db/client";
import { files, memberships, noteShares, notes } from "@/db/schema";

export async function isOrganizationMember(userId: string, organizationId: string) {
  if (!hasDatabaseConfig()) {
    return true;
  }

  const db = getDb();
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .limit(1);

  return rows.length > 0;
}

export async function canReadNote(userId: string, noteId: string) {
  if (!hasDatabaseConfig()) {
    return true;
  }

  const db = getDb();
  const rows = await db
    .select({
      authorId: notes.authorId,
      visibility: notes.visibility,
    })
    .from(notes)
    .where(and(eq(notes.id, noteId), isNull(notes.deletedAt)))
    .limit(1);

  const note = rows[0];
  if (!note) {
    return false;
  }

  if (note.authorId === userId) {
    return true;
  }

  if (note.visibility === "org") {
    return isOrganizationMember(userId, await getNoteOrganizationId(noteId));
  }

  if (note.visibility === "shared") {
    const sharedRows = await db
      .select({ noteId: noteShares.noteId })
      .from(noteShares)
      .where(and(eq(noteShares.noteId, noteId), eq(noteShares.userId, userId)))
      .limit(1);

    return sharedRows.length > 0 && (await isOrganizationMember(userId, await getNoteOrganizationId(noteId)));
  }

  return false;
}

export async function canWriteNote(userId: string, noteId: string) {
  if (!hasDatabaseConfig()) {
    return true;
  }

  const db = getDb();
  const rows = await db
    .select({ authorId: notes.authorId, organizationId: notes.organizationId, visibility: notes.visibility })
    .from(notes)
    .where(and(eq(notes.id, noteId), isNull(notes.deletedAt)))
    .limit(1);

  const note = rows[0];
  if (!note) {
    return false;
  }

  if (note.authorId === userId) {
    return true;
  }

  if (note.visibility === "private") {
    return false;
  }

  return isOrganizationMember(userId, note.organizationId);
}

export async function canAccessFile(userId: string, fileId: string) {
  if (!hasDatabaseConfig()) {
    return true;
  }

  const db = getDb();
  const rows = await db
    .select({
      organizationId: files.organizationId,
      noteId: files.noteId,
    })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  const file = rows[0];
  if (!file) {
    return false;
  }

  if (!(await isOrganizationMember(userId, file.organizationId))) {
    return false;
  }

  if (!file.noteId) {
    return true;
  }

  return canReadNote(userId, file.noteId);
}

async function getNoteOrganizationId(noteId: string) {
  const db = getDb();
  const rows = await db
    .select({ organizationId: notes.organizationId })
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  return rows[0]?.organizationId ?? "";
}

export async function canUploadToOrganization(userId: string, organizationId: string) {
  return isOrganizationMember(userId, organizationId);
}

export function buildStorageKey(input: {
  organizationId: string;
  noteId?: string | null;
  fileId: string;
  originalName: string;
}) {
  const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const scope = input.noteId ? `notes/${input.noteId}` : "org";
  return `orgs/${input.organizationId}/${scope}/${input.fileId}-${safeName}`;
}
