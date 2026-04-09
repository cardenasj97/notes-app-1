# REVIEW

## What I reviewed deeply vs. what I sampled

The auth flow got the closest read — sign-up through note creation, AI summary generation, and file uploads, all the way to how sessions gate access. Authorization helpers across pages, mutations, search, uploads, and AI routes were checked for cross-org leakage (note visibility, search results, file downloads). The search engine also got deep attention because it matches across both title and body text, which made pagination and ranking correctness real concerns; that work included tracing the cursor queries, verifying first-page SSR vs. second-page fetches, and manually testing search-plus-pagination sequences.

Beyond auth and search, most shipped features received a close review pass: note CRUD, sharing, AI summaries (including stale-acceptance logic), file uploads, version diffs, and the deployment pipeline (Dockerfile, Railway health checks, env-loading). The local bootstrap path — Drizzle migrations, seed commands, storage bucket creation — was reviewed enough to uncover real bugs (server-only misuse, missing bucket bootstrap, env fragility).

What I sampled rather than deeply verified: overall visual polish and layout, the broader UX of less-critical interaction paths, navigation, creation of members, organization switching.

The latest patch moved part of the permission model itself: org members can now edit org-visible/shared notes and accept AI summaries on them, but only authors can delete notes or manage sharing. Because that crosses both policy and UI, it should be treated as a permission-regression-sensitive change, not just a small polish pass.

## What I distrusted most

The search engine. It has to match across note titles and body text simultaneously, which makes ranking correctness non-trivial — a query that matches a title should probably outrank a body-only hit, but verifying that under real data volume is hard to do exhaustively. This area received the most direct manual testing as a result.

## What I'd review next with more time

Database schema first: column constraints, indexes, and relationship modeling in the Drizzle definitions deserve a thorough pass that hasn't happened yet. After that, a real seeded-from-zero run against a blank Supabase project — bucket creation, file uploads, sign-in with the documented test accounts — to confirm the bootstrap path works end-to-end without any leftover state. Finally, verifying that Railway's runtime env-loading matches what the local scripts assume, so there's no silent divergence between local and hosted behavior.
