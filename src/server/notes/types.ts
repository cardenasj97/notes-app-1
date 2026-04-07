import type { AiSummary } from "@/lib/types";
import type {
  NoteChangeSource,
  NoteVisibility,
  OrganizationRole,
} from "@/db/schema";

export type NotesViewer = {
  userId: string;
  displayName: string;
  email: string;
  activeOrganizationId: string | null;
  organizationIds: string[];
  roleByOrganizationId: Record<string, OrganizationRole>;
};

export type NoteShareSummary = {
  userId: string;
  displayName: string;
  email: string;
};

export type NoteVersionSummary = {
  id: string;
  noteId: string;
  organizationId: string;
  versionNumber: number;
  editedBy: string;
  editedByDisplayName: string;
  changeSource: NoteChangeSource;
  changedFields: string[];
  titleSnapshot: string;
  bodySnapshot: string;
  visibilitySnapshot: NoteVisibility;
  tagsSnapshot: string[];
  sharedUserIdsSnapshot: string[];
  acceptedSummarySnapshot: AiSummary | null;
  createdAt: string;
};

export type NoteRecord = {
  id: string;
  organizationId: string;
  authorId: string;
  authorDisplayName: string;
  authorEmail: string;
  title: string;
  body: string;
  visibility: NoteVisibility;
  tags: string[];
  sharedUsers: NoteShareSummary[];
  currentVersionNumber: number;
  acceptedSummary: AiSummary | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  versions: NoteVersionSummary[];
};

export type NoteListItem = Pick<
  NoteRecord,
  | "id"
  | "organizationId"
  | "authorDisplayName"
  | "title"
  | "visibility"
  | "tags"
  | "currentVersionNumber"
  | "updatedAt"
> & {
  bodyPreview: string;
  shareCount: number;
};

export type NoteDiffLine = {
  kind: "added" | "removed" | "unchanged";
  value: string;
};

export type NoteDiff = {
  changedFields: string[];
  lines: NoteDiffLine[];
};

export type NoteSearchResult = NoteListItem & {
  score: number;
};

export type DemoNoteSeed = Omit<NoteRecord, "versions">;
