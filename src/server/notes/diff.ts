import { diffLines } from "diff";

import type { NoteDiff, NoteVersionSummary } from "./types";

function compareStringSets(before: string[], after: string[]) {
  const normalizedBefore = [...before].sort();
  const normalizedAfter = [...after].sort();

  return normalizedBefore.join("\n") === normalizedAfter.join("\n");
}

type SnapshotShape = Pick<
  NoteVersionSummary,
  | "titleSnapshot"
  | "bodySnapshot"
  | "visibilitySnapshot"
  | "tagsSnapshot"
  | "sharedUserIdsSnapshot"
  | "acceptedSummarySnapshot"
>;

export function getChangedFields(previous: SnapshotShape, current: SnapshotShape) {
  const changedFields: string[] = [];

  if (previous.titleSnapshot !== current.titleSnapshot) {
    changedFields.push("title");
  }

  if (previous.bodySnapshot !== current.bodySnapshot) {
    changedFields.push("body");
  }

  if (previous.visibilitySnapshot !== current.visibilitySnapshot) {
    changedFields.push("visibility");
  }

  if (!compareStringSets(previous.tagsSnapshot, current.tagsSnapshot)) {
    changedFields.push("tags");
  }

  if (!compareStringSets(previous.sharedUserIdsSnapshot, current.sharedUserIdsSnapshot)) {
    changedFields.push("shares");
  }

  if (JSON.stringify(previous.acceptedSummarySnapshot) !== JSON.stringify(current.acceptedSummarySnapshot)) {
    changedFields.push("summary");
  }

  return changedFields;
}

export function buildNoteDiff(previousBody: string, currentBody: string): NoteDiff {
  const lines = diffLines(previousBody, currentBody).flatMap((part) =>
    part.value
      .split("\n")
      .filter((line, index, array) => !(index === array.length - 1 && line === ""))
      .map((line) => ({
        kind: (part.added ? "added" : part.removed ? "removed" : "unchanged") as NoteDiff["lines"][number]["kind"],
        value: line,
      })),
  );

  return {
    changedFields: [],
    lines,
  };
}

export function compareVersionSnapshots(
  previous: NoteVersionSummary,
  current: NoteVersionSummary,
): NoteDiff {
  return {
    changedFields: getChangedFields(previous, current),
    lines: buildNoteDiff(previous.bodySnapshot, current.bodySnapshot).lines,
  };
}
