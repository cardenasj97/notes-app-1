import { getAppShellContext } from "@/server/orgs/context";

export default async function AppHome() {
  const context = await getAppShellContext();
  const activeOrg = context.activeOrganization;

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
            Content slot
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            This page intentionally stays neutral so future notes routes can reuse the same shell
            without demo-only UI.
          </p>
        </article>
      </div>
    </section>
  );
}
