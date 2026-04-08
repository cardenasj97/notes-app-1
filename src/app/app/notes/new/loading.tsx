export default function NewNoteLoading() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="h-9 w-40 animate-pulse rounded bg-zinc-200" />
      </div>

      <div className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {/* Title */}
        <div className="grid gap-2">
          <div className="h-5 w-10 animate-pulse rounded bg-zinc-200" />
          <div className="h-[46px] w-full animate-pulse rounded-2xl bg-zinc-100" />
        </div>

        {/* Markdown body */}
        <div className="grid gap-2">
          <div className="h-5 w-28 animate-pulse rounded bg-zinc-200" />
          <div className="h-[312px] w-full animate-pulse rounded-2xl bg-zinc-100" />
        </div>

        {/* Visibility + Tags */}
        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-200" />
            <div className="h-[46px] w-full animate-pulse rounded-2xl bg-zinc-100" />
          </div>
          <div className="grid gap-2">
            <div className="h-5 w-10 animate-pulse rounded bg-zinc-200" />
            <div className="h-[46px] w-full animate-pulse rounded-2xl bg-zinc-100" />
          </div>
        </div>

        {/* Shared user IDs */}
        <div className="grid gap-2">
          <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="h-[46px] w-full animate-pulse rounded-2xl bg-zinc-100" />
          <div className="h-3 w-72 animate-pulse rounded bg-zinc-100" />
        </div>

        {/* Submit button */}
        <div className="flex flex-wrap gap-3">
          <div className="h-[42px] w-28 animate-pulse rounded-full bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
