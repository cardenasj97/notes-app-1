# NOTES

## 2026-04-07
- Bootstrapped `notes-app-1` with Next.js 16, TypeScript, Tailwind, pnpm, and a local git repository.
- Installed core runtime dependencies for Supabase, Drizzle, Postgres, Markdown rendering, structured AI summaries, and test tooling.
- Established shared foundation files for env handling, logging, schema ownership, audit logging, Supabase clients, and middleware.
- Spawned three parallel workers for auth/org shell, notes/search/versioning, and files/AI/deployment.
- Integrated the first worker results into the main repo and started an integration pass with lint and build checks.
- Found integration gaps during review: `/app` layout was still demo-oriented, notes DB reads were incomplete, and API routes were using placeholder header auth instead of session-backed auth.
- Added user-facing organization file uploads/downloads on `/app` and note-level file + AI summary panels on note detail pages.
- Verified the final state with `pnpm lint`, `pnpm test`, and `pnpm build`.

## 2026-04-08
- Reviewed the staged follow-up patch after `8a2205b` to understand what changed before touching the review artifacts.
- Confirmed the latest patch is about developer/bootstrap reliability rather than product features: database scripts now load `.env.local`, seed imports no longer trip over `server-only`, and seed creates the storage bucket before attempting uploads.
- Interpreted the package script changes as a fix for local CLI execution paths where `drizzle-kit` and `tsx` were being run without the expected env file context.
- Interpreted the `src/db/client.ts` and `src/server/supabase/service.ts` changes as a fix for seed/runtime boundary issues, because those modules are used by the seed flow and should not be marked `server-only`.
- Interpreted the `src/db/seed.ts` change as a fix for fresh-project setup failures where file upload seeding would break if the storage bucket had not already been created manually.
- Noted the `README.md` credential addition as a delivery/supportability improvement so reviewers can sign in immediately after seeding without digging through the seed source.
- Rewrote `NOTES.md`, `AI_USAGE.md`, `BUGS.md`, and `REVIEW.md` so the deliverables no longer stop at the previous docs-only commit and instead describe the current staged patch too.
- Added a repo-carried post-commit Codex hook plus `pnpm hooks:install` so the deliverable docs can be refreshed after future commits without relying on memory.
- Adjusted the first hook version to run in the background after it proved too slow to keep inline on the `git commit` path.
- Planned a fresh verification pass after the doc refresh so the artifacts reflect the actual current repo state rather than just the intended patch.
