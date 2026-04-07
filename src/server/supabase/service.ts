import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/env";

export function createSupabaseServiceClient() {
  const config = getPublicSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!config || !serviceRoleKey) {
    return null;
  }

  return createClient(config.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
