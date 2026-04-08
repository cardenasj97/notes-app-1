"use client";

import { useFormStatus } from "react-dom";
import { deleteNoteAction } from "@/server/notes/actions";

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="whitespace-nowrap rounded-full border border-rose-300 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  return (
    <form action={deleteNoteAction}>
      <input type="hidden" name="noteId" value={noteId} />
      <DeleteButton />
    </form>
  );
}
