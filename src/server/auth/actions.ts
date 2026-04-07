"use server";

import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import { logger } from "@/lib/logger";

import { clearSelectedOrgCookie } from "@/server/orgs/service";

import { ensureProfileForUser, getCurrentSupabaseUser, signOutCurrentUser } from "./session";
import type { AuthActionState } from "./action-state";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const signUpSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(8),
});

export async function signInAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    };
  }

  const { createSupabaseServerClient } = await import("@/server/supabase/server");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      message: "Supabase is not configured yet.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    logger.warn("auth.sign_in_failed", {
      email: parsed.data.email,
      error: error?.message ?? "unknown",
    });
    return {
      message: "Invalid email or password.",
    };
  }

  await ensureProfileForUser(data.user);
  logger.info("auth.sign_in", { email: parsed.data.email });
  redirect("/app");
}

export async function signUpAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    };
  }

  const { createSupabaseServerClient } = await import("@/server/supabase/server");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      message: "Supabase is not configured yet.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    logger.warn("auth.sign_up_failed", {
      email: parsed.data.email,
      error: error.message,
    });
    return {
      message: error.message,
    };
  }

  if (data.user) {
    await ensureProfileForUser(data.user, parsed.data.displayName);
    logger.info("auth.sign_up", { email: parsed.data.email });
  }

  if (data.session) {
    redirect("/app");
  }

  return {
    message: "Account created. Check your email if confirmation is enabled, then sign in.",
  };
}

export async function signOutAction() {
  await signOutCurrentUser();
  await clearSelectedOrgCookie();
  logger.info("auth.sign_out");
  redirect("/auth/sign-in");
}

export async function getSignedInUserEmail() {
  const user = await getCurrentSupabaseUser();
  return user?.email ?? null;
}
