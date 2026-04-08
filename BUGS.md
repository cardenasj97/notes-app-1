# BUGS

- `/app` initially rendered a demo-focused notes shell instead of the real org-management shell. Fixed in `dc71c83`.
- The first DB-backed notes path still mixed real queries with demo-only helpers, which would have broken configured mode. Fixed in `b5a11c4`.
- File and AI API routes initially trusted an `x-user-id` header instead of the authenticated session. Fixed in `b5a11c4`.
- Fresh local DB commands could miss `.env.local`, which made `db:generate`, `db:push`, `db:studio`, and `db:seed` depend on the shell environment instead of the project default. Fixed in `92c142e`.
- The seed path imported helpers marked `server-only`, which is safe for Next.js request handling but unsafe for CLI execution and can break seeding before any app code runs. Fixed in `92c142e`.
- Seeding a fresh Supabase project could fail while uploading seed files because the storage bucket was assumed to exist already. Fixed in `92c142e`.
- The DB-backed notes list query ordered by a literal fallback rank when no search term was present, which Drizzle compiled into `order by 0 desc` and caused `/app/notes` to crash for normal browsing. Fixed in `13e4990`.
- The first cursor-based `Load more` implementation built second-page SQL predicates with JS `Date` objects inside the query template, which caused `/api/notes` cursor requests to fail even though the first page loaded correctly. Fixed in `990f16e`.
- The earlier docs automation strategy relied on a nested post-commit Codex run, which made it possible to push code without updated `NOTES.md`, `AI_USAGE.md`, `BUGS.md`, and `REVIEW.md` when the refresh step hung or was bypassed. Fixed in `990f16e`.
- The notes page still split search behavior between a server-rendered top-level form and a client-side paginated feed, which left the UX inconsistent once pagination moved into the feed. Fixed in `ca54d49`.
- The note surfaces still had a few polish regressions after the pagination/search refactor: missing back navigation on edit, weak input/body contrast, and button labels that could wrap awkwardly in tighter layouts. Fixed in `364bb41`.
