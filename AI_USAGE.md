# AI_USAGE

## Planned Split
- Main agent: scaffold, schema ownership, shared config, integration, docs, and final review.
- Worker 1: auth, org switching, memberships, role checks, and app shell.
- Worker 2: notes, tags, sharing, versions, diffs, and search.
- Worker 3: files, AI summaries, logging touchpoints, Docker, and Railway config.
- Review/Test agents: permission review, deployment review, and smoke-test review after implementation lands.

## Notes
- Schema ownership stays with the main agent to avoid migration conflicts.
- Review follow-up tasks were sent back to the same workers after the first integration pass exposed mismatches between their slices.
