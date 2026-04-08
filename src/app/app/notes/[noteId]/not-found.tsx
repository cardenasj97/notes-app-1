import Link from "next/link";

export default function NoteNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
        Note not found
      </p>
      <p className="text-sm text-zinc-500">
        This note may have been deleted or you may not have access to it.
      </p>
      <Link
        href="/app/notes"
        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
      >
        Back to notes
      </Link>
    </div>
  );
}
