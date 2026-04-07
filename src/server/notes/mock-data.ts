import { slugify } from "@/lib/utils";

import type { DemoNoteSeed, NoteRecord, NoteShareSummary, NoteVersionSummary, NotesViewer } from "./types";

export const demoProfiles = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "alice@notes.app",
    displayName: "Alice",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "bob@notes.app",
    displayName: "Bob",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "carmen@notes.app",
    displayName: "Carmen",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "dev@notes.app",
    displayName: "Dev",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    email: "priya@notes.app",
    displayName: "Priya",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    email: "omar@notes.app",
    displayName: "Omar",
  },
] as const;

export const demoOrganizations = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "North Star",
    slug: "north-star",
    createdBy: demoProfiles[0].id,
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    name: "Blue Harbor",
    slug: "blue-harbor",
    createdBy: demoProfiles[2].id,
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    name: "Orbit Labs",
    slug: "orbit-labs",
    createdBy: demoProfiles[4].id,
  },
] as const;

export const demoMemberships = [
  { organizationId: demoOrganizations[0].id, userId: demoProfiles[0].id, role: "owner" as const },
  { organizationId: demoOrganizations[0].id, userId: demoProfiles[1].id, role: "admin" as const },
  { organizationId: demoOrganizations[0].id, userId: demoProfiles[3].id, role: "member" as const },
  { organizationId: demoOrganizations[1].id, userId: demoProfiles[2].id, role: "owner" as const },
  { organizationId: demoOrganizations[1].id, userId: demoProfiles[1].id, role: "member" as const },
  { organizationId: demoOrganizations[1].id, userId: demoProfiles[3].id, role: "member" as const },
  { organizationId: demoOrganizations[2].id, userId: demoProfiles[4].id, role: "owner" as const },
  { organizationId: demoOrganizations[2].id, userId: demoProfiles[5].id, role: "member" as const },
  { organizationId: demoOrganizations[2].id, userId: demoProfiles[0].id, role: "member" as const },
] as const;

const share = (
  userId: string,
  profile = demoProfiles.find((item) => item.id === userId) ?? demoProfiles[0],
): NoteShareSummary => ({
  userId,
  displayName: profile.displayName,
  email: profile.email,
});

const version = (
  noteId: string,
  organizationId: string,
  editedBy: string,
  versionNumber: number,
  changeSource: NoteVersionSummary["changeSource"],
  titleSnapshot: string,
  bodySnapshot: string,
  visibilitySnapshot: NoteVersionSummary["visibilitySnapshot"],
  tagsSnapshot: string[],
  sharedUserIdsSnapshot: string[],
  acceptedSummarySnapshot: NoteVersionSummary["acceptedSummarySnapshot"] = null,
  changedFields: string[] = ["title", "body"],
): NoteVersionSummary => ({
  id: `${noteId}-v${versionNumber}`,
  noteId,
  organizationId,
  versionNumber,
  editedBy,
  editedByDisplayName:
    demoProfiles.find((profile) => profile.id === editedBy)?.displayName ?? "Unknown",
  changeSource,
  changedFields,
  titleSnapshot,
  bodySnapshot,
  visibilitySnapshot,
  tagsSnapshot,
  sharedUserIdsSnapshot,
  acceptedSummarySnapshot,
  createdAt: new Date(Date.UTC(2026, 3, versionNumber, 10, versionNumber, 0)).toISOString(),
});

const noteSeed = (
  data: DemoNoteSeed,
  versions: NoteVersionSummary[],
): NoteRecord => ({
  ...data,
  versions,
});

export function createDemoNotes(): NoteRecord[] {
  const notes = [
    noteSeed(
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        organizationId: demoOrganizations[0].id,
        authorId: demoProfiles[0].id,
        authorDisplayName: demoProfiles[0].displayName,
        authorEmail: demoProfiles[0].email,
        title: "Launch Checklist",
        body: "Ship the landing page, approval flow, and support playbook.\n\nOwner: Alice",
        visibility: "private",
        tags: ["launch", "internal"],
        sharedUsers: [],
        currentVersionNumber: 2,
        acceptedSummary: null,
        createdAt: "2026-04-01T10:00:00.000Z",
        updatedAt: "2026-04-06T10:00:00.000Z",
        deletedAt: null,
      },
      [
        version(
          "dddddddd-dddd-dddd-dddd-dddddddddddd",
          demoOrganizations[0].id,
          demoProfiles[0].id,
          1,
          "manual_edit",
          "Launch Checklist",
          "Ship the landing page and approval flow.",
          "private",
          ["launch"],
          [],
          null,
          ["title", "body", "tags"],
        ),
        version(
          "dddddddd-dddd-dddd-dddd-dddddddddddd",
          demoOrganizations[0].id,
          demoProfiles[0].id,
          2,
          "manual_edit",
          "Launch Checklist",
          "Ship the landing page, approval flow, and support playbook.\n\nOwner: Alice",
          "private",
          ["launch", "internal"],
          [],
          null,
          ["body", "tags"],
        ),
      ],
    ),
    noteSeed(
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        organizationId: demoOrganizations[0].id,
        authorId: demoProfiles[1].id,
        authorDisplayName: demoProfiles[1].displayName,
        authorEmail: demoProfiles[1].email,
        title: "Launch Checklist",
        body: "Public launch tasks for North Star.\n\nInclude billing, search, and export.",
        visibility: "org",
        tags: ["launch", "product"],
        sharedUsers: [],
        currentVersionNumber: 1,
        acceptedSummary: null,
        createdAt: "2026-04-02T10:00:00.000Z",
        updatedAt: "2026-04-02T10:00:00.000Z",
        deletedAt: null,
      },
      [
        version(
          "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          demoOrganizations[0].id,
          demoProfiles[1].id,
          1,
          "manual_edit",
          "Launch Checklist",
          "Public launch tasks for North Star.\n\nInclude billing, search, and export.",
          "org",
          ["launch", "product"],
          [],
          null,
          ["title", "body", "tags", "visibility"],
        ),
      ],
    ),
    noteSeed(
      {
        id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        organizationId: demoOrganizations[1].id,
        authorId: demoProfiles[2].id,
        authorDisplayName: demoProfiles[2].displayName,
        authorEmail: demoProfiles[2].email,
        title: "Roadmap Sync Notes",
        body: "Meet with engineering on Tuesday.\n\nDecisions: search, files, and AI summary safety.",
        visibility: "shared",
        tags: ["roadmap", "sync"],
        sharedUsers: [share(demoProfiles[3].id), share(demoProfiles[5].id)],
        currentVersionNumber: 2,
        acceptedSummary: null,
        createdAt: "2026-04-03T10:00:00.000Z",
        updatedAt: "2026-04-06T09:30:00.000Z",
        deletedAt: null,
      },
      [
        version(
          "ffffffff-ffff-ffff-ffff-ffffffffffff",
          demoOrganizations[1].id,
          demoProfiles[2].id,
          1,
          "manual_edit",
          "Roadmap Sync Notes",
          "Meet with engineering on Tuesday.\n\nDecisions: search and files.",
          "org",
          ["roadmap"],
          [],
          null,
          ["body", "tags", "visibility"],
        ),
        version(
          "ffffffff-ffff-ffff-ffff-ffffffffffff",
          demoOrganizations[1].id,
          demoProfiles[2].id,
          2,
          "manual_edit",
          "Roadmap Sync Notes",
          "Meet with engineering on Tuesday.\n\nDecisions: search, files, and AI summary safety.",
          "shared",
          ["roadmap", "sync"],
          [demoProfiles[3].id, demoProfiles[5].id],
          null,
          ["body", "tags", "visibility", "shares"],
        ),
      ],
    ),
    noteSeed(
      {
        id: "12121212-1212-1212-1212-121212121212",
        organizationId: demoOrganizations[2].id,
        authorId: demoProfiles[4].id,
        authorDisplayName: demoProfiles[4].displayName,
        authorEmail: demoProfiles[4].email,
        title: "Launch Checklist",
        body: "Orbit Labs launch checklist.\n\nFocus on onboarding and retention.",
        visibility: "org",
        tags: ["launch", "growth"],
        sharedUsers: [],
        currentVersionNumber: 1,
        acceptedSummary: null,
        createdAt: "2026-04-04T10:00:00.000Z",
        updatedAt: "2026-04-05T10:00:00.000Z",
        deletedAt: null,
      },
      [
        version(
          "12121212-1212-1212-1212-121212121212",
          demoOrganizations[2].id,
          demoProfiles[4].id,
          1,
          "manual_edit",
          "Launch Checklist",
          "Orbit Labs launch checklist.\n\nFocus on onboarding and retention.",
          "org",
          ["launch", "growth"],
          [],
          null,
          ["title", "body", "tags", "visibility"],
        ),
      ],
    ),
    noteSeed(
      {
        id: "34343434-3434-3434-3434-343434343434",
        organizationId: demoOrganizations[1].id,
        authorId: demoProfiles[3].id,
        authorDisplayName: demoProfiles[3].displayName,
        authorEmail: demoProfiles[3].email,
        title: "Private Journal",
        body: "Personal notes about meeting prep, blocked tasks, and tomorrow's review.",
        visibility: "private",
        tags: ["journal", "personal"],
        sharedUsers: [],
        currentVersionNumber: 1,
        acceptedSummary: null,
        createdAt: "2026-04-03T12:00:00.000Z",
        updatedAt: "2026-04-03T12:00:00.000Z",
        deletedAt: null,
      },
      [
        version(
          "34343434-3434-3434-3434-343434343434",
          demoOrganizations[1].id,
          demoProfiles[3].id,
          1,
          "manual_edit",
          "Private Journal",
          "Personal notes about meeting prep, blocked tasks, and tomorrow's review.",
          "private",
          ["journal", "personal"],
          [],
          null,
          ["title", "body", "tags", "visibility"],
        ),
      ],
    ),
  ];

  return notes;
}

export function createDemoStore() {
  return {
    profiles: [...demoProfiles],
    organizations: [...demoOrganizations],
    memberships: [...demoMemberships],
    notes: createDemoNotes(),
  };
}

const demoStore = createDemoStore();

export function getDemoStore() {
  return demoStore;
}

export function getDemoViewer(): NotesViewer {
  const activeOrganizationId = demoOrganizations[0].id;

  return {
    userId: demoProfiles[0].id,
    displayName: demoProfiles[0].displayName,
    email: demoProfiles[0].email,
    activeOrganizationId,
    organizationIds: demoMemberships
      .filter((membership) => membership.userId === demoProfiles[0].id)
      .map((membership) => membership.organizationId),
    roleByOrganizationId: demoMemberships.reduce<Record<string, "owner" | "admin" | "member">>(
      (accumulator, membership) => {
        if (membership.userId === demoProfiles[0].id) {
          accumulator[membership.organizationId] = membership.role;
        }

        return accumulator;
      },
      {},
    ),
  };
}

export function getDemoNoteById(noteId: string) {
  return demoStore.notes.find((note) => note.id === noteId) ?? null;
}

export function setDemoNote(note: NoteRecord) {
  const index = demoStore.notes.findIndex((item) => item.id === note.id);

  if (index === -1) {
    demoStore.notes.unshift(note);
    return note;
  }

  demoStore.notes[index] = note;
  return note;
}

export function removeDemoNote(noteId: string) {
  demoStore.notes = demoStore.notes.filter((note) => note.id !== noteId);
}

export function resetDemoStore() {
  const fresh = createDemoStore();
  demoStore.profiles = fresh.profiles;
  demoStore.organizations = fresh.organizations;
  demoStore.memberships = fresh.memberships;
  demoStore.notes = fresh.notes;
}

export function getDemoOrganizationSlug(organizationId: string) {
  return demoOrganizations.find((organization) => organization.id === organizationId)?.slug
    ?? slugify(organizationId);
}
