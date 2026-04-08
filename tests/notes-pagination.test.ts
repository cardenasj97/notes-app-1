import { beforeEach, describe, expect, it } from "vitest";

import { demoOrganizations, getDemoStore, getDemoViewer, resetDemoStore } from "@/server/notes/mock-data";
import { filterAccessibleNotesInMemory, searchAccessibleNotesInMemory } from "@/server/notes/search";

function encodeCursor(cursor: { updatedAt: string; id: string; score?: number }) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(cursor: string) {
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
    updatedAt: string;
    id: string;
    score?: number;
  };
}

function paginateBrowse(organizationId: string, cursor = "", limit = 1) {
  const viewer = getDemoViewer();
  const notes = filterAccessibleNotesInMemory(getDemoStore().notes, viewer, organizationId, "");
  const decoded = cursor ? decodeCursor(cursor) : null;
  const startIndex = decoded ? notes.findIndex((note) => note.id === decoded.id) + 1 : 0;
  const slice = notes.slice(startIndex, startIndex + limit + 1);
  const pageItems = slice.slice(0, limit);

  return {
    items: pageItems,
    nextCursor:
      slice.length > limit
        ? encodeCursor({
            updatedAt: pageItems[pageItems.length - 1]!.updatedAt,
            id: pageItems[pageItems.length - 1]!.id,
          })
        : null,
  };
}

function paginateSearch(organizationId: string, query: string, cursor = "", limit = 1) {
  const viewer = getDemoViewer();
  const notes = searchAccessibleNotesInMemory(getDemoStore().notes, viewer, organizationId, query);
  const decoded = cursor ? decodeCursor(cursor) : null;
  const startIndex = decoded ? notes.findIndex((note) => note.id === decoded.id) + 1 : 0;
  const slice = notes.slice(startIndex, startIndex + limit + 1);
  const pageItems = slice.slice(0, limit);

  return {
    items: pageItems,
    nextCursor:
      slice.length > limit
        ? encodeCursor({
            updatedAt: pageItems[pageItems.length - 1]!.updatedAt,
            id: pageItems[pageItems.length - 1]!.id,
            score: pageItems[pageItems.length - 1]!.score,
          })
        : null,
  };
}

describe("notes pagination", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("returns successive browse pages without duplicates", () => {
    const organizationId = demoOrganizations[0].id;

    const firstPage = paginateBrowse(organizationId);
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = paginateBrowse(organizationId, firstPage.nextCursor ?? "");
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);
  });

  it("returns successive search pages without duplicates", () => {
    const organizationId = demoOrganizations[0].id;

    const firstPage = paginateSearch(organizationId, "launch");
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = paginateSearch(organizationId, "launch", firstPage.nextCursor ?? "");
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);
  });
});
