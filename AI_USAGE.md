# AI_USAGE

## Original Build Split
- Main agent: scaffold, schema ownership, shared config, integration, docs, and final review.
- Worker 1: auth, org switching, memberships, role checks, and app shell.
- Worker 2: notes, tags, sharing, versions, diffs, and search.
- Worker 3: files, AI summaries, logging touchpoints, Docker, and Railway config.
- Review/Test agents: permission review, deployment review, and smoke-test review after implementation lands.

## Latest Patch Split
- Main agent only: inspected the staged bootstrap/seed patch, updated the review artifacts, and handled verification locally.
- No new sub-agents were used for the latest patch because the changes were small, tightly coupled, and mostly about runtime boundaries and repo hygiene.
- Main agent only: investigated the `/app/notes` runtime failure, isolated the broken Drizzle query shape, implemented the minimal query-builder extraction, and added the regression test locally.
- Main agent only: implemented cursor-based note pagination, the incremental `/api/notes` feed path, route-level loading states, and the follow-up cursor query fix locally.
- Main agent only: replaced the nested post-commit docs automation with pre-commit/pre-push verification so deliverable docs must already be updated before shipping code.
- Main agent only: handled the latest notes UX polish locally, including client-side search behavior inside the feed, new-note/detail loading states, shell layout cleanup, and small repo-hygiene config fixes.
- Main agent only: handled the current follow-up locally too, because it is still a tightly coupled UI/runtime cleanup across note pages, global CSS behavior, file upload controls, and Docker packaging.

## What Ran In Parallel
- The original product build used three parallel implementation workers plus later review/test follow-ups.
- The latest patch did not use parallel workers; keeping it local reduced the chance of missing cross-file implications between package scripts, seed code, and shared Supabase helpers.
- The notes query fix also stayed local because the failure sat on a single critical path and the fastest safe move was to inspect the generated SQL, patch the query branch, and validate it immediately.
- The pagination and docs-enforcement work also stayed local because both changes touched critical repo-wide paths: notes query ordering, API error classification, client feed behavior, hooks, wrapper scripts, and the required project docs.
- The latest staged polish also stayed local because it sits across the same notes UX path and repo tooling path: feed state, app-shell composition, loading states, `.gitignore`, and Drizzle config.
- This follow-up also stayed local because it is mostly polish and consistency work, where the integration cost of delegating exceeds the implementation cost.

## Where Agents Were Wrong
- Earlier implementation slices drifted at the `/app` shell boundary, the notes data path, and API auth boundary, which led to the issues already captured in `BUGS.md`.
- For the latest patch, the main distrust point was not agent output quality but the tendency for small infra fixes to look obvious while still breaking CLI-only flows if not tested end to end.

## Where I Intervened
- Schema ownership stays with the main agent to avoid migration conflicts.
- Review follow-up tasks were sent back to the same workers after the first integration pass exposed mismatches between their slices.
- Parallel execution helped on three independent slices, but the main integration risk was still cross-slice drift at the `/app` shell, note data path, and API auth boundary.
- The final integration and verification pass was handled locally to reconcile overlapping assumptions and get the repo to a clean `lint` + `test` + `build` state.
- The latest patch was reviewed and documented locally because the affected files sit on the same execution path: package scripts invoke seed/Drizzle, seed imports shared DB and service helpers, and the seed flow depends on storage bootstrap being correct.
- The notes query regression was also handled locally because the bug was narrow, reproducible, and safer to fix with a direct SQL-shape regression test than with a parallel handoff.
- The pagination follow-up remained local because the first implementation changed both SSR and incremental client fetching, and the fastest safe path was to inspect the generated SQL, verify the second-page request, and patch the cursor branch directly.
- The docs-consistency fix also stayed local because it changes the repo’s commit/push contract and should not be delegated while the enforcement behavior is still being established.
- The latest UX/config cleanup also stayed local because it is small, tightly coupled, and easiest to validate in one pass rather than splitting between UI and tooling workers.
- The same applied to this patch: local handling was faster and safer than parallel work because the changes are visual polish plus one Docker packaging adjustment.

## What I Still Do Not Trust Agents To Do
- Cross-boundary fixes that span framework markers like `server-only`, CLI entry points, and environment bootstrapping without a local verification pass.
- Review artifact updates that claim a repo state has been verified when the latest staged patch has not actually been exercised.
- Query-builder fixes in permission-sensitive paths without inspecting the generated SQL or running the real code path they affect.
- Hook and wrapper automation that rewrites repo state after a commit. For this repo, agents should update docs explicitly first and use hooks only for validation or reminders.
