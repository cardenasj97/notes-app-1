import Link from "next/link";

import type { NoteVersionSummary } from "@/server/notes/types";

type NoteHistoryProps = {
  noteId: string;
  versions: NoteVersionSummary[];
  activeFrom?: number;
  activeTo?: number;
};

export function NoteHistory({ noteId, versions, activeFrom, activeTo }: NoteHistoryProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">
        Version History
      </h3>
      <div className="mt-4 space-y-3">
        {versions.map((version, index) => {
          const previous = versions[index + 1];

          return (
            <div
              key={version.id}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">Version {version.versionNumber}</p>
                  <p className="text-sm text-zinc-500">
                    {version.editedByDisplayName} · {new Date(version.createdAt).toLocaleString()}
                  </p>
                </div>
                {previous ? (
                  <Link
                    href={`/app/notes/${noteId}?from=${previous.versionNumber}&to=${version.versionNumber}`}
                    className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-950 transition hover:bg-white"
                  >
                    Compare with previous
                  </Link>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-zinc-600">
                {version.changeSource} · {version.changedFields.join(", ") || "No changed fields"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
