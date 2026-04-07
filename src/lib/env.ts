import { z } from "zod";

const runtimeEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
});

const env = runtimeEnvSchema.parse(process.env);

export function getDatabaseUrl() {
  return env.DATABASE_URL ?? env.DIRECT_DATABASE_URL ?? null;
}

export function getPublicSupabaseEnv() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseServiceRoleKey() {
  return env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

export function getStorageBucketName() {
  return env.SUPABASE_STORAGE_BUCKET ?? "notes-app-files";
}

export function getOpenAiConfig() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? "gpt-4.1-mini",
  };
}

export function getMissingCoreConfig() {
  const missing: string[] = [];

  if (!getDatabaseUrl()) {
    missing.push("DATABASE_URL");
  }

  if (!getPublicSupabaseEnv()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!getSupabaseServiceRoleKey()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return Array.from(new Set(missing));
}
