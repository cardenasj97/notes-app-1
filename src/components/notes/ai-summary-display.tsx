import type { AiSummary } from "@/lib/types";

const summaryLabels: Record<keyof AiSummary, string> = {
  overview: "Overview",
  keyPoints: "Key points",
  actionItems: "Action items",
  openQuestions: "Open questions",
};

type AiSummaryDisplayProps = {
  summary: AiSummary;
};

export function AiSummaryDisplay({ summary }: AiSummaryDisplayProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
        AI summary
      </p>
      <h3 className="mt-2 text-xl font-semibold text-zinc-950">Note summary</h3>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Object.entries(summaryLabels).map(([key, label]) => {
          const summaryKey = key as keyof AiSummary;
          const value = summary[summaryKey];
          const items = Array.isArray(value) ? value : [value];

          return (
            <div key={summaryKey} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">{label}</p>
              <div className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
                {items.length ? (
                  items.map((item, index) => <p key={`${summaryKey}-${index}`}>{item}</p>)
                ) : (
                  <p>No content.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
