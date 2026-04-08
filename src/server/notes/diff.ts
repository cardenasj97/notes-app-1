import { diffLines } from "diff";

import type { AiSummary } from "@/lib/types";

import type { NoteDiff, NoteDiffLine, NoteVersionSummary } from "./types";

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

function summaryToText(summary: AiSummary | null): string {
  if (!summary) return "";

  return [
    `Overview: ${summary.overview}`,
    "",
    ...summary.keyPoints.map((p) => `Key point: ${p}`),
    "",
    ...summary.actionItems.map((a) => `Action item: ${a}`),
    "",
    ...summary.openQuestions.map((q) => `Open question: ${q}`),
  ].join("\n");
}

function diffText(previous: string, current: string): NoteDiffLine[] {
  return diffLines(previous, current).flatMap((part) =>
    part.value
      .split("\n")
      .filter((line, index, array) => !(index === array.length - 1 && line === ""))
      .map((line) => ({
        kind: (part.added ? "added" : part.removed ? "removed" : "unchanged") as NoteDiffLine["kind"],
        value: line,
      })),
  );
}

function buildSummaryDiff(previous: AiSummary | null, current: AiSummary | null): NoteDiffLine[] {
  const prevText = summaryToText(previous);
  const currText = summaryToText(current);

  if (prevText === currText) return [];

  return diffText(prevText, currText);
}

export function buildNoteDiff(previousBody: string, currentBody: string): NoteDiff {
  return {
    changedFields: [],
    lines: diffText(previousBody, currentBody),
    summaryLines: [],
  };
}

export function compareVersionSnapshots(
  previous: NoteVersionSummary,
  current: NoteVersionSummary,
): NoteDiff {
  return {
    changedFields: getChangedFields(previous, current),
    lines: diffText(previous.bodySnapshot, current.bodySnapshot),
    summaryLines: buildSummaryDiff(
      previous.acceptedSummarySnapshot,
      current.acceptedSummarySnapshot,
    ),
  };
}
