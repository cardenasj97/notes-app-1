import "server-only";

import { eq } from "drizzle-orm";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getDb, hasDatabaseConfig } from "@/db/client";
import { profiles } from "@/db/schema";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { getPublicSupabaseEnv } from "@/lib/env";

export type SessionProfile = typeof profiles.$inferSelect;

export type AuthContext = {
  user: User;
  profile: SessionProfile;
};

function fallbackDisplayName(user: User) {
  const metadataName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.display_name as string | undefined);

  if (metadataName?.trim()) {
    return metadataName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0] ?? user.email;
  }

  return "Member";
}

export async function getCurrentSupabaseUser() {
  const config = getPublicSupabaseEnv();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only session check in server components.
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function ensureProfileForUser(user: User, displayName?: string) {
  if (!user.email) {
    throw new Error("Auth user is missing an email address.");
  }

  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required to create or load a profile.");
  }

  const db = getDb();
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.email, user.email),
  });

  if (existing) {
    if (displayName && displayName.trim() && existing.displayName !== displayName.trim()) {
      const [updated] = await db
        .update(profiles)
        .set({
          displayName: displayName.trim(),
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
      email: user.email,
      displayName: displayName?.trim() || fallbackDisplayName(user),
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create a profile for the signed-in user.");
  }

  logger.info("auth.profile_created", {
    profileId: created.id,
    email: created.email,
  });

  return created;
}

export async function getCurrentAuthContext(options?: {
  createProfile?: boolean;
  displayName?: string;
}) {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    return null;
  }

  if (!user.email) {
    throw new Error("Signed-in user is missing an email address.");
  }

  const db = getDb();
  let profile = await db.query.profiles.findFirst({
    where: eq(profiles.email, user.email),
  });

  if (!profile && options?.createProfile) {
    profile = await ensureProfileForUser(user, options.displayName);
  }

  if (!profile) {
    return null;
  }

  return {
    user,
    profile,
  } satisfies AuthContext;
}

export async function requireAuthContext(options?: {
  createProfile?: boolean;
  displayName?: string;
}) {
  const context = await getCurrentAuthContext(options);

  if (!context) {
    redirect("/auth/sign-in");
  }

  return context;
}

export async function signOutCurrentUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}
