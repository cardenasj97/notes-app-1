# AI Usage

## Which Agents I Used

- **Codex** (via Cloud Code): used for the initial plan of the application and build application core.
- **Claude Code**: used for iterative development and QA checks using the playground MCP.

## How Work Was Split

Codex handled the initial plan and architecture of the application. Claude Code took over for the iterations — implementing features, fixing issues, and running QA checks against the live app using the playground MCP.

## What Ran In Parallel

At the start of the build, I ran three Codex workers in parallel:

- **Worker 1**: auth, org switching, memberships, role checks, and app shell.
- **Worker 2**: notes, tags, sharing, versions, diffs, and search.
- **Worker 3**: files, AI summaries, logging touchpoints, Docker, and Railway config.

Later in development, I also ran Claude Code agents in parallel to quickly fix UI issues as they came up.

## Where Agents Were Wrong

The first version of the UI/UX had problems. Font colors in the input fields were wrong, and buttons had text wrapping issues. These needed manual correction.

The notes page was also loading every note from the database without pagination, which I had to fix.

## Where I Intervened

When agents started over-engineering things or spending too much time trying to solve something, I stepped in and gave them direct guidance to keep things moving.

## What I Don't Trust Agents To Do

I don't trust agents to do the full QA of the application. They're not bulletproof. I prefer to add a human QA pass myself at the end of development to catch what they miss.
