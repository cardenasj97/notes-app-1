"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { AiSummary } from "@/lib/types";

type AiSummaryPanelProps = {
  noteId: string;
  noteVersionId: string;
  acceptedSummary: AiSummary | null;
};

const summaryLabels: Record<keyof AiSummary, string> = {
  overview: "Overview",
  keyPoints: "Key points",
  actionItems: "Action items",
  openQuestions: "Open questions",
};

export function AiSummaryPanel({
  noteId,
  noteVersionId,
  acceptedSummary,
}: AiSummaryPanelProps) {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiSummary | null>(null);
  const [currentSummary, setCurrentSummary] = useState<AiSummary | null>(acceptedSummary);
  const [selection, setSelection] = useState({
    overview: true,
    keyPoints: true,
    actionItems: true,
    openQuestions: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  async function generateSummary() {
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId,
          noteVersionId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to generate AI summary.");
      }

      setDraftId(payload.draftId ?? null);
      setDraft(payload.summary);
      setSelection({
        overview: true,
        keyPoints: true,
        actionItems: true,
        openQuestions: true,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to generate AI summary.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function acceptSummary() {
    if (!draftId || !draft) {
      return;
    }

    setError(null);
    setIsAccepting(true);

    try {
      const response = await fetch("/api/ai/summary/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftId,
          selection,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to accept AI summary.");
      }

      if (payload.accepted === false) {
        throw new Error(payload.reason ?? "The summary could not be accepted.");
      }

      setCurrentSummary({
        overview: draft.overview,
        keyPoints: selection.keyPoints ? draft.keyPoints : currentSummary?.keyPoints ?? [],
        actionItems: selection.actionItems ? draft.actionItems : currentSummary?.actionItems ?? [],
        openQuestions: selection.openQuestions
          ? draft.openQuestions
          : currentSummary?.openQuestions ?? [],
      });
      setDraft(null);
      setDraftId(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to accept AI summary.");
    } finally {
      setIsAccepting(false);
    }
  }

  const visibleSummary = draft ?? currentSummary;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            AI summary
          </p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-950">Generate a structured note summary</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            The summary is generated for the current note version and only becomes canonical after you
            accept the selected sections.
          </p>
        </div>
        <button
          type="button"
          onClick={generateSummary}
          disabled={isGenerating}
          className="rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generating..." : "Generate summary"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {visibleSummary ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Object.entries(summaryLabels).map(([key, label]) => {
            const summaryKey = key as keyof AiSummary;
            const value = visibleSummary[summaryKey];
            const items = Array.isArray(value) ? value : [value];

            return (
              <div key={summaryKey} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <label className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{label}</p>
                    <div className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
                      {items.length ? (
                        items.map((item, index) => <p key={`${summaryKey}-${index}`}>{item}</p>)
                      ) : (
                        <p>No content.</p>
                      )}
                    </div>
                  </div>
                  {draft ? (
                    <input
                      type="checkbox"
                      checked={summaryKey === "overview" ? true : selection[summaryKey]}
                      onChange={(event) =>
                        setSelection((current) => ({
                          ...current,
                          [summaryKey]: event.target.checked,
                        }))
                      }
                      disabled={summaryKey === "overview"}
                      className="mt-1 size-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                    />
                  ) : null}
                </label>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          No AI summary has been generated for this version yet.
        </div>
      )}

      {draftId && draft ? (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={acceptSummary}
            disabled={isAccepting}
            className="rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAccepting ? "Applying..." : "Accept selected sections"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
