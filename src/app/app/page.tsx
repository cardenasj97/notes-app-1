import Link from "next/link";

import { getAppShellContext } from "@/server/orgs/context";
import { FilePanel } from "@/components/notes/file-panel";
import { listOrganizationFiles } from "@/server/files/service";

export default async function AppHome() {
  const context = await getAppShellContext();
  const activeOrg = context.activeOrganization;
  const notesHref = activeOrg ? `/app/notes?organizationId=${activeOrg.id}` : null;
  const createNoteHref = activeOrg ? `/app/notes/new?organizationId=${activeOrg.id}` : null;
  const orgFiles =
    activeOrg
      ? await listOrganizationFiles(activeOrg.id, {
          userId: context.profile.id,
        }).catch(() => [])
      : [];

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
          Workspace
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Organization management shell
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">
          Use the sidebar to switch organizations, create a new organization, and manage
          members. Notes pages will render in this content area without changing the shell.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Active organization
          </p>
          {activeOrg ? (
            <div className="mt-3 space-y-2">
              <h3 className="text-xl font-semibold text-white">{activeOrg.name}</h3>
              <p className="text-sm text-slate-300">Role: {activeOrg.role}</p>
              <p className="text-sm text-slate-400">
                {context.members.length} member{context.members.length === 1 ? "" : "s"} in
                this workspace.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-300">
              No organization is selected yet. Create one from the sidebar to start using the
              workspace.
            </p>
          )}
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Notes
          </p>
          {activeOrg ? (
            <div className="mt-3 space-y-4">
              <p className="text-sm leading-7 text-slate-300">
                Jump into the notes workspace for {activeOrg.name} or create a new note directly
                from the current organization context.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={notesHref!}
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Open notes
                </Link>
                <Link
                  href={createNoteHref!}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Create note
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Select or create an organization first, then use the notes workspace to create and
              search notes for that organization.
            </p>
          )}
        </article>
      </div>

      {activeOrg ? (
        <FilePanel
          title="Organization files"
          description="Upload shared workspace files that any member of the active organization can access."
          organizationId={activeOrg.id}
          files={orgFiles}
        />
      ) : null}
    </section>
  );
}
