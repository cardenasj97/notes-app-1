import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  noteTagLinks as noteTagLinksTable,
  notes as noteTable,
  profiles as profilesTable,
  tags as tagsTable,
} from "@/db/schema";

type NotesQueryDb = Pick<ReturnType<typeof getDb>, "select">;

type BuildListAccessibleNotesQueryInput = {
  organizationId: string;
  userId: string;
  search: string;
};

export function buildListAccessibleNotesQuery(
  db: NotesQueryDb,
  { organizationId, userId, search }: BuildListAccessibleNotesQueryInput,
) {
  const searchFilter: SQL = search
    ? sql`to_tsvector('english', ${noteTable.searchDocument}) @@ plainto_tsquery('english', ${search})`
    : sql`true`;
  const visibilityFilter = sql`
    (
      ${noteTable.authorId} = ${userId}
      OR ${noteTable.visibility} = 'org'
      OR (
        ${noteTable.visibility} = 'shared'
        AND EXISTS (
          SELECT 1
          FROM note_shares
          WHERE note_shares.note_id = ${noteTable.id}
            AND note_shares.user_id = ${userId}
        )
      )
    )
  `;
  const scoreSql = search
    ? sql<number>`ts_rank(to_tsvector('english', ${noteTable.searchDocument}), plainto_tsquery('english', ${search}))`
    : sql<number>`0`;

  const query = db
    .select({
      id: noteTable.id,
      organizationId: noteTable.organizationId,
      authorDisplayName: profilesTable.displayName,
      title: noteTable.title,
      visibility: noteTable.visibility,
      tags: sql<string[]>`coalesce(array_remove(array_agg(distinct ${tagsTable.name}), null), '{}')`,
      currentVersionNumber: noteTable.currentVersionNumber,
      updatedAt: noteTable.updatedAt,
      body: noteTable.body,
      shareCount: sql<number>`(select count(*)::int from note_shares where note_shares.note_id = ${noteTable.id})`,
      score: scoreSql,
    })
    .from(noteTable)
    .innerJoin(profilesTable, eq(noteTable.authorId, profilesTable.id))
    .leftJoin(noteTagLinksTable, eq(noteTable.id, noteTagLinksTable.noteId))
    .leftJoin(tagsTable, eq(noteTagLinksTable.tagId, tagsTable.id))
    .where(
      and(
        eq(noteTable.organizationId, organizationId),
        isNull(noteTable.deletedAt),
        visibilityFilter,
        searchFilter,
      ),
    )
    .groupBy(noteTable.id, profilesTable.displayName);

  if (!search) {
    return query.orderBy(desc(noteTable.updatedAt));
  }

  return query.orderBy(desc(scoreSql), desc(noteTable.updatedAt));
}
