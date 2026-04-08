import Link from "next/link";

import { NotesFeed } from "@/components/notes/notes-feed";
import { getOrganizationNotesPage } from "@/server/notes/service";
import { getAppShellContext } from "@/server/orgs/service";

type NotesPageProps = {
  searchParams?: Promise<{
    organizationId?: string;
    q?: string;
  }>;
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = (await searchParams) ?? {};
  const context = await getAppShellContext();
  const organizationId = params.organizationId ?? context.activeOrganization?.id ?? context.organizations[0]?.id ?? null;
  const query = params.q ?? "";
  const organization =
    context.organizations.find((item) => item.id === organizationId) ?? context.activeOrganization ?? null;
  const notePage = organizationId ? await getOrganizationNotesPage(organizationId, query) : null;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
            {organization?.name ?? "Organization"}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">Notes</h2>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Search titles, Markdown bodies, and tags while staying inside org boundaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {organizationId ? (
            <Link
              href={`/app/notes/new?organizationId=${organizationId}`}
              className="whitespace-nowrap rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              New note
            </Link>
          ) : null}
        </div>
      </section>

      {organizationId ? (
        <NotesFeed
          initialItems={notePage?.items ?? []}
          initialNextCursor={notePage?.nextCursor ?? null}
          organizationId={organizationId}
          query={query}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 text-zinc-500">
          Create or join an organization to start using notes.
        </div>
      )}
    </div>
  );
}
