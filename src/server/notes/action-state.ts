export type NoteFormActionState = {
  fieldErrors?: {
    title?: string[];
    body?: string[];
    visibility?: string[];
    tags?: string[];
    sharedUserIds?: string[];
  };
  message?: string;
  fieldValues?: {
    title?: string;
    body?: string;
    visibility?: string;
    tags?: string;
    sharedUserIds?: string;
  };
};

export const initialNoteFormActionState: NoteFormActionState = {};
