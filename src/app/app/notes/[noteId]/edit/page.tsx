import Link from "next/link";
import { notFound } from "next/navigation";

import { NoteForm } from "@/components/notes/note-form";
import { updateNoteAction } from "@/server/notes/actions";
import { getActiveNotesViewer, getNoteDetail } from "@/server/notes/service";
import { listOrganizationMembers } from "@/server/orgs/service";

type NoteEditPageProps = {
  params: Promise<{ noteId: string }>;
};

export default async function NoteEditPage({ params }: NoteEditPageProps) {
  const { noteId } = await params;
  const [note, viewer] = await Promise.all([
    getNoteDetail(noteId).catch(() => null),
    getActiveNotesViewer(),
  ]);

  if (!note) {
    notFound();
  }

  const members = await listOrganizationMembers(note.organizationId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/app/notes/${noteId}`}
          className="text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          &larr; Back
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Edit</p>
        <h2 className="text-3xl font-semibold tracking-tight">{note.title}</h2>
      </div>
      <NoteForm
        organizationId={note.organizationId}
        action={updateNoteAction}
        submitLabel="Save note"
        note={note}
        members={members}
        currentUserId={viewer.userId}
      />
    </div>
  );
}
