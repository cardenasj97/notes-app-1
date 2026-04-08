"use client";

import { useEffect, useState } from "react";

import { NoteList, NoteListSkeleton } from "@/components/notes/note-list";
import type { NoteListItem, NoteListPage } from "@/server/notes/types";

type NotesFeedProps = {
  initialItems: NoteListItem[];
  initialNextCursor: string | null;
  organizationId: string;
  query: string;
};

const PAGE_SIZE = 24;

export function NotesFeed({ initialItems, initialNextCursor, organizationId, query }: NotesFeedProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialNextCursor);
    setIsLoadingMore(false);
    setError(null);
  }, [initialItems, initialNextCursor, organizationId, query]);

  async function loadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organizationId,
        q: query,
        cursor: nextCursor,
        limit: String(PAGE_SIZE),
      });
      const response = await fetch(`/api/notes?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to load more notes");
      }

      const payload = (await response.json()) as NoteListPage;
      setItems((current) => [...current, ...payload.items]);
      setNextCursor(payload.nextCursor);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load more notes");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="space-y-4">
      <NoteList notes={items} organizationId={organizationId} />

      {isLoadingMore ? <NoteListSkeleton count={3} /> : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {nextCursor ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
