# notes-app-1

Multi-tenant notes app built with Next.js, TypeScript, Supabase, Drizzle, and PostgreSQL.

## Scope
- Markdown notes with org/shared/private visibility
- File uploads with signed URLs
- AI summaries generated from a specific note version
- Docker + Railway deployment

## Scripts
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm db:generate`
- `pnpm db:push`
- `pnpm db:seed`

## Environment
Copy `.env.example` to `.env.local` and fill in the required values.

## Seeded login credentials
After running `pnpm db:seed`, you can sign in with these test users:

- `avery@notes-app-1.local` / `NotesApp1!Avery`
- `mina@notes-app-1.local` / `NotesApp1!Mina`
- `leo@notes-app-1.local` / `NotesApp1!Leo`
- `nadia@notes-app-1.local` / `NotesApp1!Nadia`
- `priya@notes-app-1.local` / `NotesApp1!Priya`
- `owen@notes-app-1.local` / `NotesApp1!Owen`
