import { NoteForm } from "@/components/notes/note-form";
import { createNoteAction } from "@/server/notes/actions";
import { getActiveNotesViewer } from "@/server/notes/service";

type NewNotePageProps = {
  searchParams?: Promise<{
    organizationId?: string;
  }>;
};

export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  const params = (await searchParams) ?? {};
  const viewer = await getActiveNotesViewer();
  const organizationId = params.organizationId ?? viewer.activeOrganizationId ?? viewer.organizationIds[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          {organizationId ?? "No organization selected"}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">New note</h2>
      </div>
      {organizationId ? (
        <NoteForm organizationId={organizationId} action={createNoteAction} submitLabel="Create note" />
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-zinc-500">
          Create or join an organization before adding notes.
        </div>
      )}
    </div>
  );
}
