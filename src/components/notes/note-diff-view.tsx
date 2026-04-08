import type { NoteDiff } from "@/server/notes/types";

type NoteDiffViewProps = {
  diff: NoteDiff;
};

export function NoteDiffView({ diff }: NoteDiffViewProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Diff
        </h3>
        <span className="text-xs text-zinc-500">
          {diff.changedFields.length ? diff.changedFields.join(", ") : "No field changes"}
        </span>
      </div>
      {diff.summaryLines.length > 0 ? (
        <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Body</h4>
      ) : null}
      <div className="space-y-1 font-mono text-sm leading-6">
        {diff.lines.map((line, index) => (
          <div
            key={`${index}-${line.kind}-${line.value}`}
            className={
              line.kind === "added"
                ? "rounded bg-emerald-50 px-3 text-emerald-800"
                : line.kind === "removed"
                  ? "rounded bg-rose-50 px-3 text-rose-800 line-through"
                  : "rounded px-3 text-zinc-700"
            }
          >
            {line.value || "\u00a0"}
          </div>
        ))}
      </div>
      {diff.summaryLines.length > 0 ? (
        <>
          <h4 className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
            Summary changes
          </h4>
          <div className="mt-2 space-y-1 font-mono text-sm leading-6">
            {diff.summaryLines.map((line, index) => (
              <div
                key={`summary-${index}-${line.kind}`}
                className={
                  line.kind === "added"
                    ? "rounded bg-emerald-50 px-3 text-emerald-800"
                    : line.kind === "removed"
                      ? "rounded bg-rose-50 px-3 text-rose-800 line-through"
                      : "rounded px-3 text-zinc-700"
                }
              >
                {line.value || "\u00a0"}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
