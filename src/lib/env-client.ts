// Client-safe env access.  Next.js only inlines NEXT_PUBLIC_* values when it
// sees direct property access (process.env.NEXT_PUBLIC_X).  The server-side
// env.ts passes the whole process.env to Zod, which prevents inlining.  This
// module exists so browser.ts (a "use client" module) gets the inlined values.

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}
