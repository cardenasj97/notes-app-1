"use client";

import { useActionState } from "react";

import { initialNoteFormActionState, type NoteFormActionState } from "@/server/notes/action-state";
import type { NoteRecord } from "@/server/notes/types";

type NoteFormProps = {
  organizationId: string;
  action: (state: NoteFormActionState, formData: FormData) => Promise<NoteFormActionState>;
  submitLabel: string;
  note?: NoteRecord;
};

export function NoteForm({ organizationId, action, submitLabel, note }: NoteFormProps) {
  const [state, formAction, pending] = useActionState<NoteFormActionState, FormData>(
    action,
    initialNoteFormActionState,
  );

  const sharedUserIds = state.fieldValues?.sharedUserIds ?? note?.sharedUsers.map((u) => u.userId).join(", ") ?? "";
  const tags = state.fieldValues?.tags ?? note?.tags.join(", ") ?? "";

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      {state.message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </div>
      ) : null}
      <input type="hidden" name="organizationId" value={organizationId} />
      {note ? <input type="hidden" name="noteId" value={note.id} /> : null}
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-900">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={state.fieldValues?.title ?? note?.title}
          placeholder="Launch Checklist"
          className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
          required
        />
        {state.fieldErrors?.title?.[0] ? (
          <p className="text-xs text-rose-500">{state.fieldErrors.title[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label htmlFor="body" className="text-sm font-medium text-zinc-900">
          Markdown body
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={state.fieldValues?.body ?? note?.body}
          rows={12}
          placeholder="Write the note in Markdown..."
          className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 leading-6 outline-none transition focus:border-zinc-900"
          required
        />
        {state.fieldErrors?.body?.[0] ? (
          <p className="text-xs text-rose-500">{state.fieldErrors.body[0]}</p>
        ) : null}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="visibility" className="text-sm font-medium text-zinc-900">
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={state.fieldValues?.visibility ?? note?.visibility ?? "org"}
            className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
          >
            <option value="private">private</option>
            <option value="org">org</option>
            <option value="shared">shared</option>
          </select>
          {state.fieldErrors?.visibility?.[0] ? (
            <p className="text-xs text-rose-500">{state.fieldErrors.visibility[0]}</p>
          ) : null}
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
          {state.fieldErrors?.tags?.[0] ? (
            <p className="text-xs text-rose-500">{state.fieldErrors.tags[0]}</p>
          ) : null}
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
