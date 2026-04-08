"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/lib/env-client";

export function createSupabaseBrowserClient() {
  const config = getPublicSupabaseEnv();

  if (!config) {
    throw new Error("Supabase browser client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClient(config.url, config.anonKey);
}
