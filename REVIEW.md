# REVIEW

## Deep Review Targets
- Authorization helpers across pages, mutations, search, uploads, and AI routes.
- Cross-org leakage risks in note visibility, search, and file downloads.
- Stale AI summary acceptance logic.

## Sampled Areas
- First integration pass across auth/org shell, notes/search, and files/AI.

## Findings So Far
- The first merged app layout still used a demo note shell and needed to be switched to the real organization shell.
- The first DB path for notes/search mixed real queries with demo-only fallbacks and needed correction before the app could be trusted in configured mode.
- The first file and AI routes used header-based user identity and needed to be replaced with session-backed auth.

## Current State
- The repo now passes `pnpm lint`, `pnpm test`, and `pnpm build`.
- Highest residual risk is configuration completeness in a real Supabase/Railway environment, not local code shape.
