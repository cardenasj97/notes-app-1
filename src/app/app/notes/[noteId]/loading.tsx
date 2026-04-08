export default function NoteDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-14 animate-pulse rounded-full bg-zinc-200" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-zinc-100" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-zinc-100" />
          </div>
          <div className="h-10 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-zinc-100" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-4 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="space-y-3">
            <div className="h-16 w-full animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-16 w-full animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </div>
      </section>
    </div>
  );
}
