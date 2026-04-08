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
- The sign-up flow dropped entered `displayName` and `email` values whenever validation or Supabase returned an error, which forced users to retype those fields on every failed submission. Fixed in `6224c3a`.
- The paginated DB search path had regressed from earlier substring-style matching to full-text matching only, which meant some note queries no longer returned expected results after pagination/search moved into the API path. Fixed in `6224c3a`.
- The debounced notes search flow could briefly show the correct client-fetched results and then overwrite them with stale server-fed `initialItems` after `router.replace`, because the feed treated the URL-driven re-render as authoritative even when the client already owned fresher results. Fixed in `62a0574`.
- Accepting an AI summary left the accepted draft in local component state until the refresh completed, which could briefly show stale draft content and stale selection state even though the acceptance had already been applied. Fixed in `e3850a8`.
- Note tags were not constrained tightly enough at the form boundary, so users could submit too many tags or oversized tag strings and only learn about the problem late, with weaker validation feedback than intended. Fixed in `e3850a8`.
- The earlier confirmation-link bug is no longer relevant because the app no longer implements an email confirmation callback flow; signup now assumes email confirmation is disabled in Supabase when instant access is required.
