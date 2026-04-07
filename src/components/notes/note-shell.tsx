import Link from "next/link";
import type { ReactNode } from "react";

import type { NotesViewer } from "@/server/notes/types";

type NoteShellProps = {
  viewer: NotesViewer;
  organizations: Array<{
    id: string;
    name: string;
  }>;
  children: ReactNode;
};

export function NoteShell({ viewer, organizations, children }: NoteShellProps) {
  const activeOrganizationId = viewer.activeOrganizationId ?? viewer.organizationIds[0] ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] text-zinc-950">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">Notes App 1</p>
            <h1 className="text-xl font-semibold">Multi-tenant notes</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {organizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/app/notes?organizationId=${organization.id}`}
                className={
                  organization.id === activeOrganizationId
                    ? "rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
                }
              >
                {organization.name}
              </Link>
            ))}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{viewer.displayName}</p>
            <p className="text-xs text-zinc-500">{viewer.email}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
