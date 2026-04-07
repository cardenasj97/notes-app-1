import { describe, expect, it } from "vitest";

import { buildNoteDiff, compareVersionSnapshots, getChangedFields } from "@/server/notes/diff";
import type { NoteVersionSummary } from "@/server/notes/types";

const beforeVersion: NoteVersionSummary = {
  id: "note-v1",
  noteId: "note",
  organizationId: "org",
  versionNumber: 1,
  editedBy: "user",
  editedByDisplayName: "User",
  changeSource: "manual_edit",
  changedFields: ["body"],
  titleSnapshot: "Launch Checklist",
  bodySnapshot: "Line 1\nLine 2",
  visibilitySnapshot: "org",
  tagsSnapshot: ["launch"],
  sharedUserIdsSnapshot: [],
  acceptedSummarySnapshot: null,
  createdAt: "2026-04-01T00:00:00.000Z",
};

const afterVersion: NoteVersionSummary = {
  ...beforeVersion,
  versionNumber: 2,
  bodySnapshot: "Line 1\nLine 3",
  tagsSnapshot: ["launch", "internal"],
  changedFields: ["body", "tags"],
  createdAt: "2026-04-02T00:00:00.000Z",
};

describe("note diffs", () => {
  it("detects changed fields between snapshots", () => {
    expect(getChangedFields(beforeVersion, afterVersion)).toEqual(["body", "tags"]);
  });

  it("builds a line diff for markdown bodies", () => {
    const diff = buildNoteDiff(beforeVersion.bodySnapshot, afterVersion.bodySnapshot);

    expect(diff.lines.some((line) => line.kind === "removed" && line.value === "Line 2")).toBe(true);
    expect(diff.lines.some((line) => line.kind === "added" && line.value === "Line 3")).toBe(true);
  });

  it("produces a version comparison diff", () => {
    const diff = compareVersionSnapshots(beforeVersion, afterVersion);

    expect(diff.changedFields).toEqual(["body", "tags"]);
    expect(diff.lines.some((line) => line.kind === "added" && line.value === "Line 3")).toBe(true);
  });
});
