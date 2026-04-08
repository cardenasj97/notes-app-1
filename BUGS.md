# BUGS

- `/app` initially rendered a demo-focused notes shell instead of the real org-management shell. Fixed in `dc71c83`.
- The first DB-backed notes path still mixed real queries with demo-only helpers, which would have broken configured mode. Fixed in `b5a11c4`.
- File and AI API routes initially trusted an `x-user-id` header instead of the authenticated session. Fixed in `b5a11c4`.
- Fresh local DB commands could miss `.env.local`, which made `db:generate`, `db:push`, `db:studio`, and `db:seed` depend on the shell environment instead of the project default. Fixed in `92c142e`.
- The seed path imported helpers marked `server-only`, which is safe for Next.js request handling but unsafe for CLI execution and can break seeding before any app code runs. Fixed in `92c142e`.
- Seeding a fresh Supabase project could fail while uploading seed files because the storage bucket was assumed to exist already. Fixed in `92c142e`.
- The DB-backed notes list query ordered by a literal fallback rank when no search term was present, which Drizzle compiled into `order by 0 desc` and caused `/app/notes` to crash for normal browsing. Fixed in `13e4990`.
