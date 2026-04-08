"use client";

import { useFormStatus } from "react-dom";

import type { NoteRecord } from "@/server/notes/types";

type NoteFormProps = {
  organizationId: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  note?: NoteRecord;
};

export function NoteForm({ organizationId, action, submitLabel, note }: NoteFormProps) {
  const sharedUserIds = note?.sharedUsers.map((sharedUser) => sharedUser.userId).join(", ") ?? "";
  const tags = note?.tags.join(", ") ?? "";

  return (
    <form action={action} className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="organizationId" value={organizationId} />
      {note ? <input type="hidden" name="noteId" value={note.id} /> : null}
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-900">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={note?.title}
          placeholder="Launch Checklist"
          className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
          required
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="body" className="text-sm font-medium text-zinc-900">
          Markdown body
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={note?.body}
          rows={12}
          placeholder="Write the note in Markdown..."
          className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 leading-6 outline-none transition focus:border-zinc-900"
          required
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="visibility" className="text-sm font-medium text-zinc-900">
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={note?.visibility ?? "org"}
            className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
          >
            <option value="private">private</option>
            <option value="org">org</option>
            <option value="shared">shared</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="tags" className="text-sm font-medium text-zinc-900">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={tags}
            maxLength={500}
            placeholder="launch, internal"
            className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="sharedUserIds" className="text-sm font-medium text-zinc-900">
          Shared user ids
        </label>
        <input
          id="sharedUserIds"
          name="sharedUserIds"
          defaultValue={sharedUserIds}
          placeholder="11111111-1111-1111-1111-111111111111, ..."
          className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
        />
        <p className="text-xs text-zinc-500">
          Optional comma-separated user ids for selective sharing within the org.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}
