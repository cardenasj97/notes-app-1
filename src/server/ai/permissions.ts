import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getDb, hasDatabaseConfig } from "@/db/client";
import { memberships, noteShares, noteVersions, notes } from "@/db/schema";

export async function canReadNote(userId: string, noteId: string) {
  if (!hasDatabaseConfig()) {
    return true;
  }

  const db = getDb();
  const rows = await db
    .select({
      authorId: notes.authorId,
      organizationId: notes.organizationId,
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

  const membershipRows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, note.organizationId)))
    .limit(1);

  if (membershipRows.length === 0) {
    return false;
  }

  if (note.visibility === "org") {
    return true;
  }

  if (note.visibility === "shared") {
    const sharedRows = await db
      .select({ noteId: noteShares.noteId })
      .from(noteShares)
      .where(and(eq(noteShares.noteId, noteId), eq(noteShares.userId, userId)))
      .limit(1);

    return sharedRows.length > 0;
  }

  return false;
}

export async function canGenerateSummary(userId: string, noteId: string, noteVersionId: string) {
  if (!(await canReadNote(userId, noteId))) {
    return false;
  }

  if (!hasDatabaseConfig()) {
    return true;
  }

  const db = getDb();
  const rows = await db
    .select({ id: noteVersions.id })
    .from(noteVersions)
    .where(and(eq(noteVersions.id, noteVersionId), eq(noteVersions.noteId, noteId)))
    .limit(1);

  return rows.length > 0;
}
