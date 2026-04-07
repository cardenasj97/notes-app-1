"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createNote, deleteNote, shareNoteWithUsers, updateNote } from "./service";

function getNoteId(formData: FormData) {
  const noteId = formData.get("noteId");

  if (typeof noteId !== "string" || !noteId) {
    throw new Error("noteId is required.");
  }

  return noteId;
}

function getOrganizationId(formData: FormData) {
  const organizationId = formData.get("organizationId");

  if (typeof organizationId !== "string" || !organizationId) {
    throw new Error("organizationId is required.");
  }

  return organizationId;
}

export async function createNoteAction(formData: FormData) {
  const organizationId = getOrganizationId(formData);
  const note = await createNote(organizationId, formData);
  revalidatePath("/app/notes");
  redirect(`/app/notes/${note.id}`);
}

export async function updateNoteAction(formData: FormData) {
  const noteId = getNoteId(formData);
  const note = await updateNote(noteId, formData);
  revalidatePath("/app/notes");
  redirect(`/app/notes/${note.id}`);
}

export async function deleteNoteAction(formData: FormData) {
  const noteId = getNoteId(formData);
  await deleteNote(noteId);
  revalidatePath("/app/notes");
  redirect("/app/notes");
}

export async function shareNoteAction(formData: FormData) {
  const noteId = getNoteId(formData);
  const sharedUserIds = String(formData.get("sharedUserIds") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  await shareNoteWithUsers(noteId, sharedUserIds);
  revalidatePath(`/app/notes/${noteId}`);
  redirect(`/app/notes/${noteId}`);
}
