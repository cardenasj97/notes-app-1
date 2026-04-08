# Playwright QA Acceptance Checklist

This document is the executable QA spec for browser-driven manual testing of this app.

This checklist is derived from the original take-home requirements and intake artifacts used to define the app.

Use it as the acceptance gate before calling the app complete.

## Goal

Prove that the app is correct, tenant-safe, reviewable, and functionally aligned with the original take-home requirements:
- auth and multi-tenancy
- notes CRUD, tagging, visibility, and selective sharing
- versioning and diffs
- search across title/body/tags with permission enforcement
- file upload and download permissions
- AI summary generation and selective acceptance
- logging visibility
- Docker / Railway readiness

This checklist is intentionally strict. Any unauthorized read or write is a blocker.

## Preconditions

Run QA against either:
- local dev URL: `BASE_URL`
- Railway deployment URL

Assume the working agent starts in the repository root.

Required local setup:

```bash
pnpm db:push
pnpm db:seed
pnpm dev
```

Recommended preflight:

```bash
pnpm lint
pnpm test
pnpm build
```

Environment assumptions:
- Supabase Auth, Postgres, and Storage are configured
- `pnpm db:seed` completed successfully
- If `OPENAI_API_KEY` is missing, AI summary still works via fallback structured output

Execution guidance for browser agents:
- Use visible text selectors first
- Prefer exact route assertions when redirects or denials happen
- Capture a screenshot on every failure
- Record active user, active organization, page URL, and observed error text for every failed case
- Keep the dev server terminal or Railway logs open for the logging section
- Do not delete seeded notes that are needed later; create `QA <timestamp>` notes for destructive tests

Useful visible labels in the UI:
- `Sign in`
- `Sign out`
- `Workspace`
- `Notes`
- `Open notes`
- `Create note`
- `New note`
- `Search notes`
- `Edit`
- `Delete`
- `Compare with previous`
- `Generate summary`
- `Accept selected sections`
- `Upload file`
- `Download`
- `Switch`
- `Create org`
- `Add member`

## Seeded Users

Use these accounts after `pnpm db:seed`:

| User | Email | Password |
|---|---|---|
| Avery Flores | `avery@notes-app-1.local` | `NotesApp1!Avery` |
| Mina Patel | `mina@notes-app-1.local` | `NotesApp1!Mina` |
| Leo Santos | `leo@notes-app-1.local` | `NotesApp1!Leo` |
| Nadia Kim | `nadia@notes-app-1.local` | `NotesApp1!Nadia` |
| Priya Bose | `priya@notes-app-1.local` | `NotesApp1!Priya` |
| Owen Garcia | `owen@notes-app-1.local` | `NotesApp1!Owen` |

## Seeded Organization Memberships

| Organization | Owner | Admin | Members |
|---|---|---|---|
| Northwind Research | Avery | Mina | Leo, Priya |
| Helio Product Studio | Nadia | Avery | Owen, Priya |
| Signal Works | Leo | Nadia | Mina, Owen |

## Expected Permission Model

Organization roles:
- `owner`: create org, switch orgs, manage members, perform owner-level org actions
- `admin`: manage members and org settings, but no private-note override
- `member`: normal org member access

Note visibility:
- `private`: author only can read, search, edit, delete, upload note files, and mutate note state
- `org`: all org members can read and search; only author can edit/delete/change note state
- `shared`: author plus explicit shared recipients in the same org can read and search; only author can edit/delete/change sharing

Important expected rules:
- Admins and owners must not bypass another user’s private note
- Search results must obey the same rules as direct note access
- Note files inherit note visibility
- Org files are visible only to members of that org
- AI generation must be permission-safe
- AI acceptance is a note mutation and should be limited to users who are allowed to change note state

## Seeded High-Value Note Scenarios

Use these deterministic seeded notes when possible:

| Org | Title | Visibility | Author | Special value |
|---|---|---|---|---|
| Northwind Research | `Northwind Research migration plan 1` | private | Avery | 3 versions, accepted AI summary, attached note file |
| Northwind Research | `Northwind Research search ranking 2` | org | Mina | attached note file |
| Northwind Research | `Northwind Research tenant boundary 3` | org | Leo | attached note file |
| Northwind Research | `Northwind Research launch checklist 5` | shared | Avery | shared to Mina only |
| Helio Product Studio | `Helio Product Studio launch checklist 5` | shared | Nadia | shared to Avery only |
| Signal Works | `Signal Works launch checklist 5` | shared | Leo | shared to Nadia only |

Shared search phrases that appear across orgs:
- `migration plan`
- `search ranking`
- `tenant boundary`
- `design review`
- `launch checklist`
- `ops handoff`
- `incident response`
- `editor workflow`
- `summary review`
- `permissions audit`

## Requirement Coverage Map

| Requirement | Covered by suites |
|---|---|
| Sign-in, create org, switch org, tenant-safe auth | 1, 2, 3 |
| Notes CRUD, tagging, visibility, selective sharing | 4, 5 |
| Versioning, actor/timestamp/change details, diffs | 6 |
| Search over title/body/tags with permission safety and scale | 7 |
| File upload/download permissions | 8 |
| AI structured summary, selective acceptance, permission safety | 9 |
| Logging | 10 |
| Docker / Railway smoke | 11 |
| Seed-data usefulness and deliverables completeness | 12 |

## Suite 1: Smoke, Sign-In, Sign-Out

Steps:
1. Open `/auth/sign-in`.
2. Confirm the sign-in form shows `Email`, `Password`, and `Sign in`.
3. Sign in as `avery@notes-app-1.local`.
4. Confirm redirect to `/app`.
5. Confirm the shell shows `Signed in as Avery Flores`.
6. Confirm `Workspace` and `Notes` navigation are visible.
7. Use `Sign out`.
8. Confirm redirect back to `/auth/sign-in`.

Pass criteria:
- No console error, 500 page, or redirect loop
- Authenticated users land inside the app shell
- Sign-out fully clears session access

Blockers:
- Cannot sign in with seeded credentials
- `/app` returns an error after sign-in

## Suite 2: Navigation and Discoverability

Steps:
1. Sign in as Avery.
2. Open `/app`.
3. Confirm sidebar navigation contains `Workspace` and `Notes`.
4. Confirm `/app` home shows `Open notes` and `Create note` when an active org exists.
5. Click `Notes` and confirm landing on `/app/notes`.
6. Return to `Workspace` and confirm exact `/app` route.
7. Visit `/app/notes/new` and `/app/notes/<noteId>` for any accessible note, then confirm `Notes` remains visually active.

Pass criteria:
- Notes are discoverable from the main authenticated flow
- Active navigation state is correct on `/app` and `/app/notes*`

Blockers:
- Notes route exists but is not reachable from the shell
- `/app` hides the notes workflow completely

## Suite 3: Organization Creation and Switching

Steps:
1. Sign in as Avery.
2. In the sidebar, use `Create org` to create `QA Org <timestamp>`.
3. Confirm the org appears in the active-org switcher.
4. Switch between:
   - Northwind Research
   - Helio Product Studio
   - QA org
5. After each switch:
   - open `/app`
   - open `/app/notes`
   - confirm organization context changes
6. Sign out and sign in as Mina.
7. Confirm Mina can access Northwind Research and Signal Works, but not Helio Product Studio.

Pass criteria:
- Org creation works
- Org switching changes workspace and notes context
- Users only see orgs they belong to

Blockers:
- Cross-org access from the switcher
- Active org state is stale after switching

## Suite 4: Notes CRUD, Tagging, and Visibility

Use a new org or a new note title prefix like `QA <timestamp>` so destructive tests do not damage seeded baselines.

Steps:
1. As Avery in QA org or Northwind, create a new org-visible note using:
   - Title
   - Markdown body
   - Tags
   - Visibility = `org`
2. Confirm the note appears in the notes list.
3. Open it and confirm rendered Markdown body is visible.
4. Click `Edit`, change:
   - title
   - body
   - tags
5. Save the note and confirm the changes persist.
6. Create a second note with visibility `private`.
7. Delete one created note using `Delete`.
8. Confirm the deleted note disappears from the list and direct URL no longer behaves like a valid accessible note.

Pass criteria:
- Create, read, update, and delete all work
- Tags persist across edit
- Visibility value persists

Blockers:
- Any CRUD action fails for the author
- Deleted notes remain openly accessible

## Suite 5: Permission Boundaries and Selective Sharing

### 5A. Private note access

Steps:
1. As Avery in Northwind, search exact title `Northwind Research migration plan 1`.
2. Open the note and copy its URL.
3. Confirm it is readable by Avery.
4. Sign out and sign in as Mina.
5. Open the copied private-note URL directly.
6. Repeat with Leo and Priya if needed.

Pass criteria:
- Avery can read it
- Mina, Leo, and Priya cannot read it, even though they are in the same org
- Admin does not bypass private visibility

### 5B. Org-visible note access

Steps:
1. As Mina in Northwind, open `Northwind Research search ranking 2`.
2. Confirm Mina can read it.
3. Sign in as Leo and Priya and confirm both can read it.
4. Try to edit as a non-author and confirm editing is not allowed.

Pass criteria:
- All org members can read
- Non-author cannot mutate

### 5C. Shared note access

Steps:
1. As Avery in Northwind, open `Northwind Research launch checklist 5`.
2. Copy its URL.
3. Sign in as Mina and confirm she can open the same URL.
4. Sign in as Leo and Priya and confirm they cannot access it.

Pass criteria:
- Shared recipient can read
- Non-recipient org members cannot read
- Non-author shared recipient cannot edit or delete

### 5D. Cross-org direct URL denial

Steps:
1. As Avery, open any Helio note and copy the URL.
2. Sign in as Mina, who is not a Helio member.
3. Open the copied URL directly.

Pass criteria:
- Access is denied or redirected safely

Blockers for Suite 5:
- Any unauthorized direct note access succeeds
- Any non-author can edit/delete note state
- Shared notes leak to non-recipients

## Suite 6: Versioning, State Tracking, and Diffs

Use either a newly created note with multiple edits or the seeded private note `Northwind Research migration plan 1`.

Steps:
1. Open the note detail page.
2. Confirm `Version History` is visible.
3. Confirm each version shows:
   - version number
   - editor display name
   - timestamp
   - change source
   - changed fields
4. Click `Compare with previous`.
5. Confirm a diff view appears.
6. For a newly created note, edit it at least twice and confirm version count increments.
7. Confirm the `Latest version snapshot` section shows:
   - edited by
   - source
   - changed fields

Pass criteria:
- Version history is visible and understandable
- Diff page loads and compares correct versions
- Actor, timestamp, and change details are visible

Blockers:
- No diff available between versions
- Missing actor/timestamp/change metadata

## Suite 7: Search and Search Isolation

Use `/app/notes` with the visible `Search notes` field.

### 7A. Title, body, and tag coverage

Steps:
1. Search by exact title fragment: `launch checklist`.
2. Search by body phrase: `permissions audit`.
3. Search by tag term such as `roadmap`, `security`, or a tag you created.

Pass criteria:
- Relevant notes appear for title, body, and tag matches

### 7B. Org isolation

Steps:
1. As Avery, search `migration plan` in Northwind.
2. Confirm visible results belong to Northwind only.
3. Switch to Helio and run the same search.
4. Confirm visible results belong to Helio only.

Pass criteria:
- Same query yields different org-scoped result sets
- No card from another org leaks into the current org view

### 7C. Visibility-aware search

Steps:
1. As Avery, search exact `Northwind Research migration plan 1` and confirm it appears.
2. As Mina, search the same exact title in Northwind.
3. Confirm it does not appear for Mina.
4. As Mina, search exact `Northwind Research launch checklist 5` and confirm it appears.
5. As Leo, search the same exact shared title and confirm it does not appear.

Pass criteria:
- Search respects private/shared visibility exactly like direct access

### 7D. Scale sanity

Steps:
1. Search common overlapping terms:
   - `migration plan`
   - `search ranking`
   - `tenant boundary`
2. Confirm the page remains responsive and returns results without errors.

Pass criteria:
- No crash, timeout, or server error at seeded volume

Blockers:
- Search returns unauthorized notes
- Search crashes or leaks cross-org data

## Suite 8: Files and Download Permissions

### 8A. Org-level files

Steps:
1. On `/app`, in Northwind, confirm `Organization files` shows an existing seed file.
2. Download it as Avery.
3. Sign in as Mina and confirm the Northwind org file is also visible and downloadable.
4. Sign in as Nadia or Owen and confirm Northwind org files are not exposed through normal org navigation.

Pass criteria:
- Org file is visible only to org members

### 8B. Note-level files

Steps:
1. As Avery, open `Northwind Research migration plan 1`.
2. Confirm `Note files` shows a seed attachment and `Download` works.
3. As Mina, open the copied note URL and confirm the note and its files are not accessible.
4. As Mina or Leo, open `Northwind Research search ranking 2` and confirm org-visible note file access works.

Pass criteria:
- Private note file follows private note visibility
- Org note file follows org note visibility

### 8C. Upload flow

Steps:
1. Upload an org file from `/app`.
2. Upload a note file on a note detail page for a note you created.
3. Confirm each uploaded file appears in the correct panel and can be downloaded by an authorized user.

Pass criteria:
- Upload succeeds
- File list refreshes
- Authorized download works

### 8D. Shared-note file inheritance

Required for full AC sign-off.

Because the share form currently expects raw user UUIDs, use one of these approaches:
- preferred: fetch profile UUIDs from the database and create a new shared note with a note file
- fallback: if browser-only, mark this subtest as blocked by QA tooling limitations and do not call file visibility fully signed off

Expected result:
- author and shared recipient can access the note file
- non-recipient org member cannot
- non-member cannot

Optional local helper to fetch user UUIDs:

```bash
node --env-file-if-exists=.env.local --input-type=module -e "import postgres from 'postgres'; const sql = postgres(process.env.DATABASE_URL); const rows = await sql\`select id, email, display_name from profiles order by email\`; console.table(rows); await sql.end();"
```

Blockers:
- Unauthorized file download succeeds
- Upload bypasses org/note boundaries

## Suite 9: AI Summary and AI Permission Safety

### 9A. Generate summary

Steps:
1. Open any accessible note detail page.
2. Click `Generate summary`.
3. Confirm a structured response appears with sections:
   - Overview
   - Key points
   - Action items
   - Open questions

Pass criteria:
- Summary generates without crashing
- The result shape is structured

### 9B. Selective acceptance

Steps:
1. Generate a summary.
2. Uncheck one or more non-overview sections.
3. Click `Accept selected sections`.
4. Confirm note page refreshes.
5. Confirm version count increments.
6. Confirm latest version snapshot shows `ai_summary_accept` as the source.

Pass criteria:
- Accepting selected sections creates a new version
- Unchecked sections are not applied as accepted content

### 9C. Stale draft rejection

Steps:
1. Open the same note in two tabs.
2. In Tab A, generate a summary but do not accept it.
3. In Tab B, edit the note and save it.
4. Return to Tab A and try `Accept selected sections`.

Pass criteria:
- Acceptance fails with a stale-version style error
- The stale AI draft does not overwrite the newer note version

### 9D. AI permission boundaries

Steps:
1. As a user who can read a shared note but does not own it, open that note.
2. Try to use AI summary features.
3. As a user who cannot read a note, try to reach its AI path through the note detail URL.

Expected safety rules:
- Non-readable notes must never expose AI actions or usable AI endpoints
- AI mutation flows must not let unauthorized users change note state

Blockers:
- Unauthorized user can mutate a note through AI acceptance
- AI exposes content from inaccessible notes

## Suite 10: Logging and Operational Visibility

This suite is not browser-only. Keep local server logs or Railway logs open while running the prior suites.

Verify that logs are emitted for:
- sign-in or sign-up
- organization creation
- organization switch
- note create, edit, and delete
- file upload preparation or failure
- AI generation and acceptance
- permission denial cases

Pass criteria:
- The system produces meaningful logs for auth events, mutations, AI requests, failures, and permission denials

Blockers:
- Important flows are silent in logs
- Permission denials leave no operational trace

## Suite 11: Deployment Smoke

Run against Railway if a deployed URL is available.

Steps:
1. Open the deployed sign-in page.
2. Sign in with a seeded or deployment-specific test user.
3. Open `/app`.
4. Open `/app/notes`.
5. Search notes.
6. Open a note detail page.
7. Generate an AI summary.
8. Download an accessible file.

Pass criteria:
- Deployment is actually usable, not just buildable
- Core flows behave the same as local

If Railway is not available yet:
- use `pnpm build`
- optionally use `pnpm start` for a local production smoke pass

## Suite 12: Non-Browser Completeness Checks

These are required by the take-home but are outside Playwright-only coverage.

Verify manually in the repo:
- `README.md` exists and is accurate
- `NOTES.md` exists and is cumulative
- `AI_USAGE.md` exists and reflects agent usage and distrust points
- `BUGS.md` exists and includes commit references
- `REVIEW.md` exists
- `Dockerfile` exists
- `railway.json` exists
- git history is multi-commit and meaningful
- seeded dataset contains multiple orgs, users, files, varied visibilities, and about 10k notes

## Failure Severity

Treat these as release blockers:
- any cross-org data leak
- any private note leak to non-author
- any shared note leak to non-recipient
- any unauthorized mutation, including AI acceptance or file access
- search results containing unauthorized data
- direct URL access bypassing permissions
- version history or diff view broken
- file upload or download bypassing scoped access
- missing notes discoverability from `/app`
- deployment smoke failure

Treat these as high priority but not always hard blockers:
- missing or weak operational logs
- confusing UX that still preserves correctness
- lack of browser-only visibility into a flow that can be verified by companion shell checks

## Exit Criteria

Do not sign off the application until all of the following are true:
- every suite above is executed
- every blocker-level case passes
- any unverified case is explicitly called out with reason
- unauthorized reads and writes were tested by direct URL, UI navigation, and search where applicable
- file, AI, and search boundaries were tested separately, not assumed from note-page behavior
- deployment was smoke-tested locally or on Railway

## Suggested QA Report Format

For each suite, record:
- status: pass / fail / blocked
- environment: local or Railway
- user used
- org used
- artifact: screenshot path or short note
- failure summary if not passed

Suggested final summary:
- total suites passed
- total blockers found
- list of exact blocker findings
- list of blocked-but-unverified cases
