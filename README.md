# Notes App

A multi-tenant markdown notes application with AI-powered summaries, role-based access control, and real-time search.

**Live Preview:** [notes-app-1-production.up.railway.app](https://notes-app-1-production.up.railway.app)

## Features

- **Multi-tenant organizations** — users belong to organizations with role-based access (owner, admin, member)
- **Markdown notes** — create, edit, and view notes with full markdown rendering and version history
- **Visibility controls** — notes can be private, org-wide, or shared with specific users
- **AI summaries** — generate structured summaries (overview, key points, action items, open questions) with an accept/discard workflow
- **Search** — full-text and substring search powered by PostgreSQL GIN indexes, with cursor-based pagination
- **File uploads** — attach files to notes with org-scoped storage and signed download URLs
- **Audit logging** — track actions across the platform for compliance and transparency

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth & Storage | Supabase (Auth + Storage) |
| Database | PostgreSQL, Drizzle ORM |
| AI | OpenAI API |
| Testing | Vitest |
| Deployment | Railway, Docker |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A Supabase project (for auth, storage, and database)
- PostgreSQL database (provided by Supabase or standalone)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment template and fill in your credentials
cp .env.example .env.local

# Push the database schema
pnpm db:push

# Seed test data (creates orgs, users, notes, and storage bucket)
pnpm db:seed

# Start the dev server
pnpm dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_DATABASE_URL` | PostgreSQL connection string (direct, for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name (default: `notes-app-files`) |
| `OPENAI_API_KEY` | OpenAI API key for AI summaries |
| `OPENAI_MODEL` | OpenAI model to use (default: `gpt-4.1-mini`) |

## Test Accounts

After running `pnpm db:seed`, the following accounts are available:

| User | Email | Password |
|---|---|---|
| Avery | `avery@notes-app-1.local` | `NotesApp1!Avery` |
| Mina | `mina@notes-app-1.local` | `NotesApp1!Mina` |
| Leo | `leo@notes-app-1.local` | `NotesApp1!Leo` |
| Nadia | `nadia@notes-app-1.local` | `NotesApp1!Nadia` |
| Priya | `priya@notes-app-1.local` | `NotesApp1!Priya` |
| Owen | `owen@notes-app-1.local` | `NotesApp1!Owen` |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Apply schema to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed test data |
| `pnpm commit:with-docs -- "msg"` | Validate staged deliverable docs and create a single commit |
| `pnpm ship:with-docs -- "msg"` | Validate staged deliverable docs, commit, and push |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (AI, files, notes)
│   ├── app/               # Protected app pages
│   │   └── notes/         # Notes list, detail, edit, create
│   └── auth/              # Sign-in and sign-up pages
├── components/            # React components
│   ├── auth/              # Auth forms
│   ├── layout/            # App shell, sidebar
│   ├── notes/             # Note feed, editor, detail views
│   └── shared/            # Reusable UI components
├── db/                    # Database schema, client, seed
├── hooks/                 # React hooks
├── lib/                   # Utilities, types, env validation
└── server/                # Backend logic
    ├── ai/                # AI summary generation
    ├── audit/             # Audit logging
    ├── auth/              # Session, permissions, actions
    ├── files/             # File handling
    ├── notes/             # Notes service, queries, validation
    ├── orgs/              # Organization management
    ├── search/            # Full-text search
    └── supabase/          # Supabase client wrappers
```

## Deployment

The app deploys to [Railway](https://railway.app) using Docker.

- `Dockerfile` — multi-stage build with pnpm
- `railway.json` — Railway deployment config with Nixpacks builder and health checks

## Testing

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

Test coverage includes:
- Note permissions and visibility boundaries
- Cursor-based pagination correctness
- Full-text and substring search behavior
- AI summary selection logic
- File access permissions
- Database query regression guards
