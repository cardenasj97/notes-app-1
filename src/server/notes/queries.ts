import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  noteTagLinks as noteTagLinksTable,
  notes as noteTable,
  profiles as profilesTable,
  tags as tagsTable,
} from "@/db/schema";
import type { NotesPageCursor } from "@/server/notes/types";

type NotesQueryDb = Pick<ReturnType<typeof getDb>, "select">;

type BuildListAccessibleNotesPageQueryInput = {
  organizationId: string;
  userId: string;
  search: string;
  cursor: NotesPageCursor | null;
  limit: number;
};

function castCursorTimestamp(updatedAtIso: string) {
  return sql`${updatedAtIso}::timestamptz`;
}

function castCursorId(id: string) {
  return sql`${id}::uuid`;
}

function castCursorScore(score: number) {
  return sql`${score}::double precision`;
}

function buildBrowseCursorFilter(cursor: NotesPageCursor): SQL {
  const updatedAt = castCursorTimestamp(cursor.updatedAt);
  const id = castCursorId(cursor.id);

  return sql`
    (
      ${noteTable.updatedAt} < ${updatedAt}
      OR (${noteTable.updatedAt} = ${updatedAt} AND ${noteTable.id} < ${id})
    )
  `;
}

function buildSearchCursorFilter(scoreSql: SQL, cursor: NotesPageCursor): SQL {
  const score = castCursorScore(cursor.score ?? 0);
  const updatedAt = castCursorTimestamp(cursor.updatedAt);
  const id = castCursorId(cursor.id);

  return sql`
    (
      ${scoreSql} < ${score}
      OR (${scoreSql} = ${score} AND ${noteTable.updatedAt} < ${updatedAt})
      OR (
        ${scoreSql} = ${score}
        AND ${noteTable.updatedAt} = ${updatedAt}
        AND ${noteTable.id} < ${id}
      )
    )
  `;
}

export function buildListAccessibleNotesPageQuery(
  db: NotesQueryDb,
  { organizationId, userId, search, cursor, limit }: BuildListAccessibleNotesPageQueryInput,
) {
  const searchFilter: SQL = search
    ? sql`(
        to_tsvector('english', ${noteTable.searchDocument}) @@ plainto_tsquery('english', ${search})
        OR ${noteTable.searchDocument} ILIKE ${'%' + search + '%'}
      )`
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
  const cursorFilter: SQL = !cursor
    ? sql`true`
    : search
      ? buildSearchCursorFilter(scoreSql, cursor)
      : buildBrowseCursorFilter(cursor);

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
        cursorFilter,
      ),
    )
    .groupBy(noteTable.id, profilesTable.displayName)
    .limit(limit + 1);

  if (!search) {
    return query.orderBy(desc(noteTable.updatedAt), desc(noteTable.id));
  }

  return query.orderBy(desc(scoreSql), desc(noteTable.updatedAt), desc(noteTable.id));
}
