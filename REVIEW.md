# REVIEW

## Deep Review Targets
- Authorization helpers across pages, mutations, search, uploads, and AI routes.
- Cross-org leakage risks in note visibility, search, and file downloads.
- Stale AI summary acceptance logic.
- Local bootstrap paths for Drizzle and seed commands.
- Seed-time interactions between shared DB/Supabase helpers and CLI execution.
- Fresh-environment storage bootstrap before seed file upload.

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

## Current State
- The current staged patch improves repo setup reliability and reviewer ergonomics, but it still needs a fresh verification pass after these docs are updated.
- Highest residual risk remains environment completeness in a real Supabase/Railway deployment, especially around externally provisioned Supabase resources and secrets.

## What I Would Review Next
- A real seeded-from-zero run against a blank Supabase project, including bucket creation, file upload seed data, and sign-in with the documented test accounts.
- Railway deployment behavior with the same env-loading assumptions used by local scripts, to make sure there is no divergence between local bootstrap and hosted runtime.
