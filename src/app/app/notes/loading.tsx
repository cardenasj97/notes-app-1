import { NoteListSkeleton } from "@/components/notes/note-list";

export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <section className="grid gap-4 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-3">
          <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
          <div className="h-10 w-40 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-full bg-zinc-200" />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="h-11 flex-1 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-11 w-24 animate-pulse rounded-full bg-zinc-200" />
        </div>
      </section>

      <NoteListSkeleton />
    </div>
  );
}
