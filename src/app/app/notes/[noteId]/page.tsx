import Link from "next/link";
import { notFound } from "next/navigation";

import { AiSummaryDisplay } from "@/components/notes/ai-summary-display";
import { AiSummaryPanel } from "@/components/notes/ai-summary-panel";
import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { FilePanel } from "@/components/notes/file-panel";
import { NoteDiffView } from "@/components/notes/note-diff-view";
import { NoteHistory } from "@/components/notes/note-history";
import { NoteMarkdown } from "@/components/notes/note-markdown";
import { listNoteFiles } from "@/server/files/service";
import { getActiveNotesViewer, getNoteDetail, getNoteVersionDiff } from "@/server/notes/service";

type NoteDetailPageProps = {
  params: Promise<{ noteId: string }>;
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
};

export default async function NoteDetailPage({ params, searchParams }: NoteDetailPageProps) {
  const { noteId } = await params;
  const query = (await searchParams) ?? {};
  const viewer = await getActiveNotesViewer();
  const note = await getNoteDetail(noteId).catch(() => null);

  if (!note) {
    notFound();
  }

  const diff =
    query.from && query.to
      ? await getNoteVersionDiff(noteId, Number(query.from), Number(query.to))
      : null;

  const latestVersion = note.versions[note.versions.length - 1];
  const canEdit = viewer.userId === note.authorId;
  const files = await listNoteFiles(note.id, { userId: viewer.userId }).catch(() => []);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {note.visibility}
              </span>
              {note.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
                  #{tag}
                </span>
              ))}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">{note.title}</h2>
            <p className="text-sm text-zinc-500">
              {note.authorDisplayName} · version {note.currentVersionNumber} · updated{" "}
              {new Date(note.updatedAt).toLocaleString()}
            </p>
          </div>
          {canEdit ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/app/notes/${note.id}/edit`}
                className="whitespace-nowrap rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50"
              >
                Edit
              </Link>
              <DeleteNoteButton noteId={note.id} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Markdown body
          </h3>
          <NoteMarkdown body={note.body} />
        </div>
        <NoteHistory noteId={note.id} versions={note.versions.slice().reverse()} />
      </section>

      {diff ? <NoteDiffView diff={diff} /> : null}

      {latestVersion ? (
        <>
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Latest version snapshot
            </h3>
            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              <p>Edited by {latestVersion.editedByDisplayName}</p>
              <p>Source: {latestVersion.changeSource}</p>
              <p>Changed fields: {latestVersion.changedFields.join(", ") || "none"}</p>
            </div>
          </section>

          {canEdit ? (
            <AiSummaryPanel
              noteId={note.id}
              noteVersionId={latestVersion.id}
              acceptedSummary={note.acceptedSummary}
            />
          ) : note.acceptedSummary ? (
            <AiSummaryDisplay summary={note.acceptedSummary} />
          ) : null}
        </>
      ) : null}

      <FilePanel
        title="Note files"
        description="Upload files scoped to this note. Download links are issued only after the server checks your permissions."
        organizationId={note.organizationId}
        noteId={note.id}
        files={files}
      />
    </div>
  );
}
