import "server-only";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb, hasDatabaseConfig } from "@/db/client";
import {
  memberships,
  noteShares,
  notes,
  organizations,
  type NoteVisibility,
  type OrganizationRole,
} from "@/db/schema";
import { logger } from "@/lib/logger";

import { requireAuthContext } from "./session";

export type OrgMembershipContext = {
  organizationId: string;
  role: OrganizationRole;
  profileId: string;
};

type NoteAccessRecord = {
  id: string;
  organizationId: string;
  authorId: string;
  visibility: NoteVisibility;
};

async function getOrganizationMembership(profileId: string, organizationId: string) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required to check organization membership.");
  }

  const db = getDb();

  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, profileId), eq(memberships.organizationId, organizationId)),
  });

  return membership ?? null;
}

async function getNoteAccessRecord(noteId: string) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required to check note access.");
  }

  const db = getDb();

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  return note ?? null;
}

async function userHasSharedNoteAccess(noteId: string, profileId: string) {
  const db = getDb();
  const shared = await db.query.noteShares.findFirst({
    where: and(eq(noteShares.noteId, noteId), eq(noteShares.userId, profileId)),
  });

  return Boolean(shared);
}

export async function requireOrgMember(organizationId: string) {
  const { profile } = await requireAuthContext({ createProfile: true });
  const membership = await getOrganizationMembership(profile.id, organizationId);

  if (!membership) {
    logger.warn("auth.org_member_denied", {
      organizationId,
      profileId: profile.id,
    });
    redirect("/app");
  }

  return {
    organizationId,
    profileId: profile.id,
    role: membership.role,
  } satisfies OrgMembershipContext;
}

export async function requireOrgAdmin(organizationId: string) {
  const membership = await requireOrgMember(organizationId);

  if (membership.role === "member") {
    logger.warn("auth.org_admin_denied", {
      organizationId,
      profileId: membership.profileId,
    });
    redirect("/app");
  }

  return membership;
}

export async function requireOrgOwner(organizationId: string) {
  const membership = await requireOrgMember(organizationId);

  if (membership.role !== "owner") {
    logger.warn("auth.org_owner_denied", {
      organizationId,
      profileId: membership.profileId,
      role: membership.role,
    });
    redirect("/app");
  }

  return membership;
}

export async function requireNoteRead(noteId: string) {
  const { profile } = await requireAuthContext({ createProfile: true });
  const note = (await getNoteAccessRecord(noteId)) as NoteAccessRecord | null;

  if (!note) {
    redirect("/app");
  }

  const membership = await getOrganizationMembership(profile.id, note.organizationId);

  if (!membership) {
    logger.warn("auth.note_read_denied", {
      noteId,
      organizationId: note.organizationId,
      profileId: profile.id,
    });
    redirect("/app");
  }

  if (note.visibility === "private" && note.authorId !== profile.id) {
    logger.warn("auth.note_private_read_denied", {
      noteId,
      profileId: profile.id,
    });
    redirect("/app");
  }

  if (note.visibility === "shared" && note.authorId !== profile.id) {
    const shared = await userHasSharedNoteAccess(note.id, profile.id);

    if (!shared) {
      logger.warn("auth.note_shared_read_denied", {
        noteId,
        profileId: profile.id,
      });
      redirect("/app");
    }
  }

  return {
    note,
    organizationMembership: membership,
    profile,
  };
}

export async function requireNoteWrite(noteId: string) {
  const access = await requireNoteRead(noteId);

  if (access.note.authorId !== access.profile.id) {
    logger.warn("auth.note_write_denied", {
      noteId,
      profileId: access.profile.id,
    });
    redirect("/app");
  }

  return access;
}

export async function getOrganizationRole(organizationId: string) {
  const membership = await requireOrgMember(organizationId);
  return membership.role;
}

export async function getExistingOrganizationMembership(
  organizationId: string,
  profileId: string,
) {
  return getOrganizationMembership(profileId, organizationId);
}

export async function getOrganizationRecord(organizationId: string) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required to load organizations.");
  }

  const db = getDb();
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  return organization ?? null;
}
