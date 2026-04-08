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
- After pagination landed, the notes page still had split ownership of search UX between the server page shell and the client feed, which is a smaller but real consistency issue because paging and search now need to share the same state transitions.
- After the search/pagination cleanup, the remaining issues were mostly UX consistency gaps: note edit lacked a clear return path, some note inputs and actions had weak visual emphasis, and note creation/detail loading states were not yet fully aligned.
- The current staged patch addresses two smaller UX correctness gaps: search interaction in the notes feed still needed debounced client-side behavior, and sign-up error handling still discarded the user’s typed non-password fields.
- The current one-file follow-up addresses a client-state regression inside the notes feed: URL synchronization for debounced searches could still allow stale server-fed `initialItems` to overwrite the newer client search results.

## Current State
- The current staged patch addresses three things together: notes list scalability via cursor pagination, the cursor query failure on `Load more`, and a stricter repo workflow that requires deliverable docs to be updated before commit/push.
- The latest staged follow-up cleans up the notes UX around that pagination work by moving search responsibility into the feed, adding missing loading states, and tightening a couple of repo/runtime defaults.
- The current staged patch is a narrower polish pass on top of that work: better note affordances, more consistent loading/interaction states, and a simpler Docker `pnpm` install path.
- The next staged follow-up is even narrower: preserve form state on sign-up failures and keep note browsing/search interaction responsive without adding another round of server-owned search UI.
- The current follow-up is narrower still: keep the debounced search URL sync without letting the server re-render stomp the already-fetched client results.
- The current staged patch is another small correctness and handoff pass: document the app more clearly in the README, clear stale accepted AI draft state, and move tag constraints closer to the form boundary so bad note payloads fail earlier and more predictably.
- The email confirmation app flow was removed. Signup no longer sends users through `/auth/callback` or `/auth/confirmed`, and immediate access now assumes Supabase email confirmation is disabled at the project level.
- The current staged patch is a narrower deployment/auth hardening pass: Railway now checks a dedicated health endpoint, the `/app` shell fails closed with a controlled error screen for non-redirect exceptions, and sign-in/sign-up only redirect when a complete app auth context exists.
- The current staged patch is a narrower note-authoring hardening pass: create/edit now return structured action-state errors instead of dropping the submission into a generic failure path, the `/app` layout is forced dynamic to reduce stale auth-shell state, and `Load more` defensively drops duplicate note ids during pagination appends.
- The current staged patch is a narrower deployment/QA pass: the Docker builder now receives the required public Supabase env values at build time, and the repo includes small text fixtures for repeatable manual file-upload checks.
- The current staged patch is a final deployment alignment pass: Railway now builds via the repo Dockerfile instead of a separate Nixpacks path, so hosted builds match the container setup that was already reviewed locally.
- The current staged patch is a tiny browser-runtime fix: client-side Supabase env access now lives in a dedicated helper that uses direct `process.env.NEXT_PUBLIC_*` reads so Next.js can inline the values into the browser bundle.
- The current staged patch is a small selective-sharing UX correction: note create/edit now receives org members and renders a checkbox picker instead of a raw UUID input, which makes the shipped sharing flow match the intended product behavior.
- Highest residual product risk remains pagination correctness under real seeded DB volume for both browse and search ranking paths.
- Highest residual repo-process risk is manual bypass of the wrapper workflow, but the new pre-push hook materially reduces that gap.

## What I Would Review Next
- A real seeded-from-zero run against a blank Supabase project, including bucket creation, file upload seed data, and sign-in with the documented test accounts.
- Railway deployment behavior with the same env-loading assumptions used by local scripts, to make sure there is no divergence between local bootstrap and hosted runtime.
- A manual browser pass on `/app/notes` that exercises first-page render, repeated `Load more`, search + load more, and org switching after several appended pages.
- One intentional push attempt with stale docs to confirm the new pre-push hook blocks it as designed.
