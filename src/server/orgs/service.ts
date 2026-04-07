import "server-only";

import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { getDb, hasDatabaseConfig } from "@/db/client";
import {
  memberships,
  organizations,
  profiles,
  type OrganizationRole,
} from "@/db/schema";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/utils";

import { requireAuthContext } from "@/server/auth/session";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
  createdAt: Date;
};

export type OrganizationMemberSummary = {
  userId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  isCurrentUser: boolean;
};

export type AppShellContext = {
  profile: {
    id: string;
    email: string;
    displayName: string;
  };
  organizations: OrganizationSummary[];
  activeOrganization: OrganizationSummary | null;
  members: OrganizationMemberSummary[];
};

const ACTIVE_ORG_COOKIE = "notes-app-active-org";

function buildUniqueOrganizationSlug(name: string) {
  const base = slugify(name) || "org";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

async function readActiveOrgCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

async function writeActiveOrgCookie(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/app",
    maxAge: 60 * 60 * 24 * 30,
  });
}

async function clearActiveOrgCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);
}

export async function getActiveOrgCookie() {
  return readActiveOrgCookie();
}

export async function setActiveOrgCookie(organizationId: string) {
  await writeActiveOrgCookie(organizationId);
}

export async function clearSelectedOrgCookie() {
  await clearActiveOrgCookie();
}

export async function listOrganizationsForProfile(profileId: string) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: memberships.role,
      createdAt: organizations.createdAt,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, profileId))
    .orderBy(desc(organizations.updatedAt));

  return rows;
}

export async function listOrganizationMembers(organizationId: string) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      userId: memberships.userId,
      email: profiles.email,
      displayName: profiles.displayName,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(profiles, eq(memberships.userId, profiles.id))
    .where(eq(memberships.organizationId, organizationId))
    .orderBy(desc(memberships.createdAt));

  return rows;
}

export async function getOrganizationById(organizationId: string) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  const db = getDb();
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  return organization ?? null;
}

export async function getAppShellContext() {
  const { profile } = await requireAuthContext({ createProfile: true });
  const organizationsForUser = await listOrganizationsForProfile(profile.id);
  const activeOrgId = await readActiveOrgCookie();

  const activeOrganization =
    organizationsForUser.find((organization) => organization.id === activeOrgId) ??
    organizationsForUser[0] ??
    null;

  const members = activeOrganization
    ? await listOrganizationMembers(activeOrganization.id)
    : [];

  return {
    profile: {
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName,
    },
    organizations: organizationsForUser,
    activeOrganization,
    members: members.map((member) => ({
      ...member,
      isCurrentUser: member.userId === profile.id,
    })),
  } satisfies AppShellContext;
}

export async function createOrganizationForProfile(input: {
  profileId: string;
  name: string;
}) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required to create organizations.");
  }

  const db = getDb();
  const [organization] = await db
    .insert(organizations)
    .values({
      name: input.name.trim(),
      slug: buildUniqueOrganizationSlug(input.name),
      createdBy: input.profileId,
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to create organization.");
  }

  await db.insert(memberships).values({
    organizationId: organization.id,
    userId: input.profileId,
    role: "owner",
  });

  logger.info("org.created", {
    organizationId: organization.id,
    profileId: input.profileId,
    name: organization.name,
  });

  return organization;
}

export async function upsertProfileByEmail(input: {
  email: string;
  displayName: string;
}) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required to manage profiles.");
  }

  const db = getDb();
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.email, input.email),
  });

  if (existing) {
    if (existing.displayName !== input.displayName.trim()) {
      const [updated] = await db
        .update(profiles)
        .set({
          displayName: input.displayName.trim(),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, existing.id))
        .returning();

      return updated ?? existing;
    }

    return existing;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      email: input.email,
      displayName: input.displayName.trim(),
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create profile.");
  }

  return created;
}

export async function addMemberToOrganization(input: {
  organizationId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  invitedByProfileId: string;
}) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required to manage members.");
  }

  const db = getDb();
  const profile = await upsertProfileByEmail({
    email: input.email,
    displayName: input.displayName,
  });

  await db
    .insert(memberships)
    .values({
      organizationId: input.organizationId,
      userId: profile.id,
      role: input.role,
    })
    .onConflictDoUpdate({
      target: [memberships.organizationId, memberships.userId],
      set: {
        role: input.role,
        updatedAt: new Date(),
      },
    });

  logger.info("org.member_added", {
    organizationId: input.organizationId,
    invitedByProfileId: input.invitedByProfileId,
    userId: profile.id,
    email: profile.email,
    role: input.role,
  });

  return profile;
}
