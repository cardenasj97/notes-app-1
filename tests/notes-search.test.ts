import { beforeEach, describe, expect, it } from "vitest";

import { demoOrganizations, getDemoStore, getDemoViewer, resetDemoStore } from "@/server/notes/mock-data";
import {
  filterAccessibleNotesInMemory,
  searchAccessibleNotesInMemory,
} from "@/server/notes/search";

describe("note search", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("only returns notes from the selected organization", async () => {
    const viewer = getDemoViewer();
    const results = searchAccessibleNotesInMemory(getDemoStore().notes, viewer, demoOrganizations[0].id, "launch");

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((note) => note.organizationId === demoOrganizations[0].id)).toBe(true);
    expect(results.some((note) => note.title === "Launch Checklist")).toBe(true);
  });

  it("respects org membership when listing accessible notes", async () => {
    const viewer = getDemoViewer();
    const notes = filterAccessibleNotesInMemory(getDemoStore().notes, viewer, demoOrganizations[2].id, "");

    expect(notes.every((note) => note.organizationId === demoOrganizations[2].id)).toBe(true);
    expect(notes.some((note) => note.title === "Private Journal")).toBe(false);
  });
});
