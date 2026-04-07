import "server-only";

import { getNoteSearchResults } from "@/server/notes/service";

export async function searchNotesByOrganization(organizationId: string, query = "") {
  return getNoteSearchResults(organizationId, query);
}
