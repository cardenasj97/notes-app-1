"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { NoteFormActionState } from "./action-state";
import { createNote, deleteNote, shareNoteWithUsers, updateNote } from "./service";
import { noteFormSchema } from "./validation";

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

function extractFormFields(formData: FormData) {
  return {
    title: formData.get("title"),
    body: formData.get("body"),
    visibility: formData.get("visibility"),
    tags: formData.get("tags"),
    sharedUserIds: formData.get("sharedUserIds"),
  };
}

function buildFieldValues(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    sharedUserIds: String(formData.get("sharedUserIds") ?? ""),
  };
}

export async function createNoteAction(
  _state: NoteFormActionState,
  formData: FormData,
): Promise<NoteFormActionState> {
  const organizationId = getOrganizationId(formData);
  const parsed = noteFormSchema.safeParse(extractFormFields(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
      fieldValues: buildFieldValues(formData),
    };
  }

  try {
    const note = await createNote(organizationId, parsed.data);
    revalidatePath("/app/notes");
    redirect(`/app/notes/${note.id}`);
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return {
      message: error instanceof Error ? error.message : "Failed to create note.",
      fieldValues: buildFieldValues(formData),
    };
  }

  return {};
}

export async function updateNoteAction(
  _state: NoteFormActionState,
  formData: FormData,
): Promise<NoteFormActionState> {
  const noteId = getNoteId(formData);
  const parsed = noteFormSchema.safeParse(extractFormFields(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
      fieldValues: buildFieldValues(formData),
    };
  }

  try {
    const note = await updateNote(noteId, parsed.data);
    revalidatePath("/app/notes");
    redirect(`/app/notes/${note.id}`);
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return {
      message: error instanceof Error ? error.message : "Failed to update note.",
      fieldValues: buildFieldValues(formData),
    };
  }

  return {};
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
