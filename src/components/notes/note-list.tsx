import Link from "next/link";

import type { NoteListItem } from "@/server/notes/types";
import { cn } from "@/lib/utils";

type NoteListProps = {
  notes: NoteListItem[];
  organizationId: string;
};

const visibilityStyles: Record<NoteListItem["visibility"], string> = {
  private: "bg-zinc-900 text-white",
  org: "bg-sky-100 text-sky-900",
  shared: "bg-amber-100 text-amber-900",
};

export function NoteList({ notes, organizationId }: NoteListProps) {
  if (!notes.length) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-zinc-500">
        No notes yet. Create the first note to get started.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/app/notes/${note.id}`}
          className="group rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                visibilityStyles[note.visibility],
              )}
            >
              {note.visibility}
            </span>
            <span className="text-xs text-zinc-500">v{note.currentVersionNumber}</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950">{note.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{note.bodyPreview}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                #{tag}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            {note.authorDisplayName} · {note.shareCount} shared · org {organizationId.slice(0, 8)}
          </p>
        </Link>
      ))}
    </div>
  );
}
