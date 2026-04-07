import type { NoteRecord, NoteSearchResult, NotesViewer } from "./types";
import { canReadNote } from "./permissions";

function makeBodyPreview(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 140);
}

function sortByUpdatedDesc(notes: NoteRecord[]) {
  return [...notes].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function scoreMatch(note: NoteRecord, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return 1;
  }

  const haystack = [note.title, note.body, note.tags.join(" ")].join(" ").toLowerCase();
  let score = 0;

  for (const token of normalized.split(/\s+/).filter(Boolean)) {
    if (note.title.toLowerCase().includes(token)) {
      score += 6;
    }

    if (note.tags.some((tag) => tag.toLowerCase().includes(token))) {
      score += 4;
    }

    if (haystack.includes(token)) {
      score += 2;
    }
  }

  return score;
}

export function filterAccessibleNotesInMemory(
  notes: NoteRecord[],
  viewer: NotesViewer,
  organizationId: string,
  query = "",
) {
  const search = query.trim().toLowerCase();

  return sortByUpdatedDesc(
    notes.filter((note) => {
      if (note.organizationId !== organizationId) {
        return false;
      }

      if (!canReadNote(viewer, note)) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [note.title, note.body, note.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(search);
    }),
  );
}

export function searchAccessibleNotesInMemory(
  notes: NoteRecord[],
  viewer: NotesViewer,
  organizationId: string,
  query = "",
): NoteSearchResult[] {
  return filterAccessibleNotesInMemory(notes, viewer, organizationId, query)
    .map((note) => ({
      id: note.id,
      organizationId: note.organizationId,
      authorDisplayName: note.authorDisplayName,
      title: note.title,
      visibility: note.visibility,
      tags: [...note.tags],
      currentVersionNumber: note.currentVersionNumber,
      updatedAt: note.updatedAt,
      bodyPreview: makeBodyPreview(note.body),
      shareCount: note.sharedUsers.length,
      score: scoreMatch(note, query),
    }))
    .sort((left, right) => right.score - left.score || right.updatedAt.localeCompare(left.updatedAt));
}
