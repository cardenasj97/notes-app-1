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

## What Ran In Parallel
- The original product build used three parallel implementation workers plus later review/test follow-ups.
- The latest patch did not use parallel workers; keeping it local reduced the chance of missing cross-file implications between package scripts, seed code, and shared Supabase helpers.
- The notes query fix also stayed local because the failure sat on a single critical path and the fastest safe move was to inspect the generated SQL, patch the query branch, and validate it immediately.

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

## What I Still Do Not Trust Agents To Do
- Cross-boundary fixes that span framework markers like `server-only`, CLI entry points, and environment bootstrapping without a local verification pass.
- Review artifact updates that claim a repo state has been verified when the latest staged patch has not actually been exercised.
- Query-builder fixes in permission-sensitive paths without inspecting the generated SQL or running the real code path they affect.
