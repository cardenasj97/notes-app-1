<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deliverable Docs Workflow

These deliverable docs are mandatory and must stay current with the latest shipped code:
- `NOTES.md`
- `AI_USAGE.md`
- `BUGS.md`
- `REVIEW.md`

When committing from this repo:
- Use `pnpm commit:with-docs -- "your commit message"` for local commits.
- Use `pnpm ship:with-docs -- "your commit message"` for commits that should also push.
- Do not use plain `git commit` as the primary workflow. Plain `git commit` is fallback/manual only.

Push safety rule:
- Do not push if the deliverable docs are stale relative to the latest code commit.
- The wrapper scripts are the official enforcement path because they refresh the deliverable docs synchronously and create a follow-up docs commit only when needed.
