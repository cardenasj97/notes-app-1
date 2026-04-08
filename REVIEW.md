# REVIEW

## Deep Review Targets
- Authorization helpers across pages, mutations, search, uploads, and AI routes.
- Cross-org leakage risks in note visibility, search, and file downloads.
- Stale AI summary acceptance logic.
- Local bootstrap paths for Drizzle and seed commands.
- Seed-time interactions between shared DB/Supabase helpers and CLI execution.
- Fresh-environment storage bootstrap before seed file upload.
- Pagination correctness across first-page SSR and second-page cursor fetches.
- Deliverable-doc consistency between local commits and outgoing pushes.

## Sampled Areas
- First integration pass across auth/org shell, notes/search, and files/AI.
- README/operator guidance for seeded login flow.

## Findings So Far
- The first merged app layout still used a demo note shell and needed to be switched to the real organization shell.
- The first DB path for notes/search mixed real queries with demo-only fallbacks and needed correction before the app could be trusted in configured mode.
- The first file and AI routes used header-based user identity and needed to be replaced with session-backed auth.
- The repo's DB scripts were too dependent on the caller shell already having the right env loaded, which is fragile for local setup and reviewer reproduction.
- Shared helpers used by the seed path were incorrectly marked `server-only`, which couples CLI code to a Next.js request-only runtime marker.
- Seed assumed the storage bucket already existed, which creates a fresh-project bootstrap failure exactly when the repo is being evaluated from scratch.
- The initial notes pagination pass fixed overfetching but introduced a second-page cursor bug because the SQL predicate mixed JS `Date` objects into the Drizzle query path instead of using explicit typed SQL parameters.
- The original docs automation design was too optimistic: it tried to generate required docs after commit, which is not reliable enough to guarantee those docs stay aligned with every pushed code change.

## Current State
- The current staged patch addresses three things together: notes list scalability via cursor pagination, the cursor query failure on `Load more`, and a stricter repo workflow that requires deliverable docs to be updated before commit/push.
- Highest residual product risk remains pagination correctness under real seeded DB volume for both browse and search ranking paths.
- Highest residual repo-process risk is manual bypass of the wrapper workflow, but the new pre-push hook materially reduces that gap.

## What I Would Review Next
- A real seeded-from-zero run against a blank Supabase project, including bucket creation, file upload seed data, and sign-in with the documented test accounts.
- Railway deployment behavior with the same env-loading assumptions used by local scripts, to make sure there is no divergence between local bootstrap and hosted runtime.
- A manual browser pass on `/app/notes` that exercises first-page render, repeated `Load more`, search + load more, and org switching after several appended pages.
- One intentional push attempt with stale docs to confirm the new pre-push hook blocks it as designed.
