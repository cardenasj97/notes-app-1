"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { NoteList, NoteListSkeleton } from "@/components/notes/note-list";
import { useDebounce } from "@/hooks/use-debounce";
import type { NoteListItem, NoteListPage } from "@/server/notes/types";

type NotesFeedProps = {
  initialItems: NoteListItem[];
  initialNextCursor: string | null;
  organizationId: string;
  query: string;
};

const PAGE_SIZE = 24;

export function NotesFeed({ initialItems, initialNextCursor, organizationId, query }: NotesFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(query);
  const abortRef = useRef<AbortController | null>(null);
  const isMountRef = useRef(true);
  const lastClientQueryRef = useRef<string | null>(null);
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    // Skip if the client-side search already owns these results —
    // router.replace triggers a server re-render that feeds back stale
    // initialItems which would overwrite the client-fetched results.
    if (lastClientQueryRef.current === query) return;

    setItems(initialItems);
    setNextCursor(initialNextCursor);
    setIsLoadingMore(false);
    setIsSearching(false);
    setError(null);
  }, [initialItems, initialNextCursor, organizationId, query]);


  const search = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSearching(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          organizationId,
          q,
          limit: String(PAGE_SIZE),
        });
        const response = await fetch(`/api/notes?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Search failed");
        }

        const payload = (await response.json()) as NoteListPage;
        setItems(payload.items);
        setNextCursor(payload.nextCursor);
        lastClientQueryRef.current = q;

        const nextParams = new URLSearchParams(searchParams.toString());
        if (q) {
          nextParams.set("q", q);
        } else {
          nextParams.delete("q");
        }
        const qs = nextParams.toString();
        router.replace(qs ? `?${qs}` : "?", { scroll: false });
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        setError(caughtError instanceof Error ? caughtError.message : "Search failed");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [organizationId, router, searchParams],
  );

  useEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false;
      return;
    }

    search(debouncedSearch);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMore() {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organizationId,
        q: searchValue,
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
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search notes"
          className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-950"
        />
        {isSearching ? (
          <span className="flex items-center px-4 py-2.5 text-sm text-zinc-400">Searching…</span>
        ) : null}
      </form>

      {isSearching ? (
        <NoteListSkeleton count={6} />
      ) : (
        <NoteList notes={items} organizationId={organizationId} />
      )}

      {isLoadingMore ? <NoteListSkeleton count={3} /> : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {nextCursor && !isSearching ? (
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
