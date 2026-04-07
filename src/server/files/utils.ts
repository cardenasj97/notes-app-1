export function buildStorageKey(input: {
  organizationId: string;
  noteId?: string | null;
  fileId: string;
  originalName: string;
}) {
  const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const scope = input.noteId ? `notes/${input.noteId}` : "org";
  return `orgs/${input.organizationId}/${scope}/${input.fileId}-${safeName}`;
}
