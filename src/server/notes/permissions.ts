import type { NoteRecord, NotesViewer } from "./types";

export function isOrganizationMember(viewer: NotesViewer, organizationId: string) {
  return viewer.organizationIds.includes(organizationId);
}

export function canReadNote(viewer: NotesViewer, note: NoteRecord) {
  if (!isOrganizationMember(viewer, note.organizationId)) {
    return false;
  }

  if (note.visibility === "org") {
    return true;
  }

  if (note.visibility === "private") {
    return viewer.userId === note.authorId;
  }

  if (viewer.userId === note.authorId) {
    return true;
  }

  return note.sharedUsers.some((sharedUser) => sharedUser.userId === viewer.userId);
}

export function canWriteNote(viewer: NotesViewer, note: NoteRecord) {
  return viewer.userId === note.authorId;
}

export function canManageSharing(viewer: NotesViewer, note: NoteRecord) {
  return viewer.userId === note.authorId;
}

export function canAccessOrgFiles(viewer: NotesViewer, organizationId: string) {
  return isOrganizationMember(viewer, organizationId);
}
