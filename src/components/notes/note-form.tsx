"use client";

import { useActionState, useState } from "react";

import { initialNoteFormActionState, type NoteFormActionState } from "@/server/notes/action-state";
import type { NoteRecord } from "@/server/notes/types";

export type NoteFormMember = {
  userId: string;
  email: string;
  displayName: string;
};

type NoteFormProps = {
  organizationId: string;
  action: (state: NoteFormActionState, formData: FormData) => Promise<NoteFormActionState>;
  submitLabel: string;
  note?: NoteRecord;
  members?: NoteFormMember[];
  currentUserId?: string;
};

export function NoteForm({ organizationId, action, submitLabel, note, members = [], currentUserId }: NoteFormProps) {
  const [state, formAction, pending] = useActionState<NoteFormActionState, FormData>(
    action,
    initialNoteFormActionState,
  );

  const [visibility, setVisibility] = useState(state.fieldValues?.visibility ?? note?.visibility ?? "org");
  const isShared = visibility === "shared";

  const initialSharedIds = state.fieldValues?.sharedUserIds
    ? state.fieldValues.sharedUserIds.split(",").map((s) => s.trim()).filter(Boolean)
    : note?.sharedUsers.map((u) => u.userId) ?? [];
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(initialSharedIds);

  const shareableMembers = members.filter((m) => m.userId !== currentUserId);
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
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
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
      <input type="hidden" name="sharedUserIds" value={selectedUserIds.join(",")} />
      <div className="grid gap-2">
        <label className={`text-sm font-medium ${isShared ? "text-zinc-900" : "text-zinc-400"}`}>
          Share with
        </label>
        {shareableMembers.length > 0 ? (
          <div className={`rounded-2xl border border-zinc-300 bg-white px-4 py-3 space-y-2 ${!isShared ? "opacity-60" : ""}`}>
            {shareableMembers.map((member) => {
              const checked = selectedUserIds.includes(member.userId);
              return (
                <label
                  key={member.userId}
                  className={`flex items-center gap-3 text-sm ${isShared ? "cursor-pointer text-zinc-900" : "cursor-not-allowed text-zinc-400"}`}
                >
                  <input
                    type="checkbox"
                    disabled={!isShared}
                    checked={checked}
                    onChange={() => {
                      setSelectedUserIds((prev) =>
                        checked ? prev.filter((id) => id !== member.userId) : [...prev, member.userId],
                      );
                    }}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                  />
                  <span>{member.displayName}</span>
                  <span className="text-xs text-zinc-500">{member.email}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No other members in this organization.</p>
        )}
        <p className="text-xs text-zinc-500">
          {isShared ? "Select org members to share this note with." : "Set visibility to \"shared\" to enable sharing."}
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
