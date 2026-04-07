import { beforeEach, describe, expect, it } from "vitest";

import { canManageSharing, canReadNote, canWriteNote } from "@/server/notes/permissions";
import { demoProfiles, getDemoStore, resetDemoStore } from "@/server/notes/mock-data";
import type { NotesViewer } from "@/server/notes/types";

function viewerFor(userId: string): NotesViewer {
  const store = getDemoStore();
  const profile = store.profiles.find((item) => item.id === userId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  const memberships = store.memberships.filter((membership) => membership.userId === userId);

  return {
    userId,
    displayName: profile.displayName,
    email: profile.email,
    activeOrganizationId: memberships[0]?.organizationId ?? null,
    organizationIds: memberships.map((membership) => membership.organizationId),
    roleByOrganizationId: memberships.reduce<Record<string, "owner" | "admin" | "member">>(
      (accumulator, membership) => {
        accumulator[membership.organizationId] = membership.role;
        return accumulator;
      },
      {},
    ),
  };
}

describe("note permissions", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("allows the author to read and mutate a private note", () => {
    const store = getDemoStore();
    const note = store.notes.find((item) => item.id === "dddddddd-dddd-dddd-dddd-dddddddddddd");

    expect(note).toBeDefined();
    if (!note) {
      throw new Error("Expected demo note");
    }

    const viewer = viewerFor(demoProfiles[0].id);

    expect(canReadNote(viewer, note)).toBe(true);
    expect(canWriteNote(viewer, note)).toBe(true);
    expect(canManageSharing(viewer, note)).toBe(true);
  });

  it("blocks org admins from reading another user's private note", () => {
    const store = getDemoStore();
    const note = store.notes.find((item) => item.id === "dddddddd-dddd-dddd-dddd-dddddddddddd");

    expect(note).toBeDefined();
    if (!note) {
      throw new Error("Expected demo note");
    }

    const viewer = viewerFor(demoProfiles[1].id);

    expect(canReadNote(viewer, note)).toBe(false);
    expect(canWriteNote(viewer, note)).toBe(false);
  });

  it("allows shared users to read shared notes but not edit them", () => {
    const store = getDemoStore();
    const note = store.notes.find((item) => item.id === "ffffffff-ffff-ffff-ffff-ffffffffffff");

    expect(note).toBeDefined();
    if (!note) {
      throw new Error("Expected demo note");
    }

    const viewer = viewerFor(demoProfiles[3].id);

    expect(canReadNote(viewer, note)).toBe(true);
    expect(canWriteNote(viewer, note)).toBe(false);
  });
});
