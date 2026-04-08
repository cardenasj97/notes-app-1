import type { ReactNode } from "react";

import type { AppShellContext } from "@/server/orgs/context";

import { AddMemberForm } from "./add-member-form";
import { CreateOrgForm } from "./create-org-form";
import { MemberList } from "./member-list";
import { OrgSwitcher } from "./org-switcher";
import { ShellNav } from "./shell-nav";
import { SignOutForm } from "./sign-out-form";

export function AppShell({
  context,
  children,
}: Readonly<{
  context: AppShellContext;
  children: ReactNode;
}>) {
  const activeOrg = context.activeOrganization;
  const notesHref = activeOrg ? `/app/notes?organizationId=${activeOrg.id}` : "/app/notes";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-slate-950/60 px-5 py-6 backdrop-blur lg:w-[360px] lg:border-b-0 lg:border-r lg:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                Notes App 1
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Multi-tenant notes
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Signed in as {context.profile.displayName}
              </p>
            </div>
            <SignOutForm />
          </div>

          <div className="mt-8 space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Navigation
                </p>
                <ShellNav notesHref={notesHref} />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <OrgSwitcher
                organizations={context.organizations}
                activeOrganizationId={activeOrg?.id ?? null}
              />
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <CreateOrgForm />
            </section>

            {activeOrg ? (
              <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Active organization
                  </p>
                  <h2 className="text-lg font-semibold text-white">{activeOrg.name}</h2>
                  <p className="text-sm text-slate-400">Role: {activeOrg.role}</p>
                </div>
                <MemberList members={context.members} />
                <AddMemberForm organization={activeOrg} />
              </section>
            ) : (
              <section className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Create your first organization to start collaborating.
              </section>
            )}
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
