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
- Investigated a production-path crash on `/app/notes` and traced it to the DB notes list query ordering by a literal rank fallback, which Drizzle compiled into `order by 0 desc` when no search term was present.
- Extracted the notes list SQL builder so the empty-search and searched branches can use different `orderBy` behavior without changing the permission filter logic.
- Added a regression test that inspects generated SQL and explicitly guards against reintroducing `order by 0 desc` in the empty-search branch.
- Verified the notes query fix with `pnpm lint` and focused Vitest coverage before pushing commit `13e4990`.
- Reworked `/app/notes` from a full 10k-note server dump to cursor-based pagination with a server-rendered first page, a `Load more` client feed, and a route-level loading skeleton.
- Added `/api/notes` for incremental page fetches and kept the same org-boundary and visibility filtering in the paginated DB path.
- Investigated a second-page `Load more` failure and traced it to the cursor SQL branch using JS `Date` objects inside query templates instead of explicit typed SQL casts.
- Replaced that cursor predicate with typed browse/search cursor helpers and added regression coverage for cursor paging and duplicate-free next-page behavior.
- Added a notes detail route loading skeleton and a small pass on notes page/detail readability and button wrapping so the UI stays stable while async content loads.
- Replaced the unreliable post-commit docs generation workflow with staged-doc verification before commit and a pre-push hook that blocks code pushes when `NOTES.md`, `AI_USAGE.md`, `BUGS.md`, and `REVIEW.md` are stale.
- Moved notes search interaction fully into the client feed so searching and clearing searches no longer requires a separate server-rendered search form above the list.
- Added a loading state for `/app/notes/new`, polished note detail typography/loading, and moved the sign-out action to the bottom of the shell so the sidebar layout is more stable.
- Tightened repo/runtime ergonomics by ignoring generated PNG artifacts consistently and making `drizzle.config.ts` read DB credentials directly from `DIRECT_DATABASE_URL` or `DATABASE_URL`.
- Added a back link on the note edit screen, improved text contrast and button wrapping across the note detail/edit/file-upload surfaces, and moved more loading polish into the note creation flow.
- Scoped the global base CSS reset into Tailwind `@layer base` and added a default pointer cursor for buttons so interactive controls behave more consistently.
- Updated the Docker image setup to install `pnpm` directly instead of relying on `corepack enable`, which is safer for container builds that need deterministic package-manager availability.
- Tightened the note feed UX again by adding debounced client-side search behavior, removing the extra explicit search button state, and polishing compare/upload affordances that still had weaker contrast or layout behavior.
- Preserved sign-up form field values after validation or Supabase errors so the user no longer has to retype display name and email on every failed submission.
- Fixed a notes-feed state bug where `router.replace` on debounced client-side search could trigger a server re-render that replayed older `initialItems` back into the client and overwrote the fresher client-fetched results.
- Refreshed the README into a real project handoff document and tightened a small note UX pass: clear accepted AI drafts, show pending save state in the note form, and cap tag input/count/length so invalid tag payloads are blocked earlier.
- Removed the email confirmation app flow. `signUpAction` no longer sets `emailRedirectTo`, and the dedicated `/auth/callback` and `/auth/confirmed` routes were deleted so signup now depends on Supabase email confirmation being disabled if immediate access is expected.
- Added a real `/api/health` endpoint and pointed Railway health checks at it, then hardened the app shell auth path so workspace-load failures render a controlled error state and auth pages only redirect when a full app auth context exists instead of just a raw Supabase session.
