"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ShellNavProps = {
  notesHref: string;
};

function linkClassName(active: boolean) {
  return active
    ? "rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
    : "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10";
}

export function ShellNav({ notesHref }: Readonly<ShellNavProps>) {
  const pathname = usePathname();
  const workspaceActive = pathname === "/app";
  const notesActive = pathname.startsWith("/app/notes");

  return (
    <nav className="flex flex-wrap gap-3" aria-label="Primary">
      <Link href="/app" className={linkClassName(workspaceActive)}>
        Workspace
      </Link>
      <Link href={notesHref} className={linkClassName(notesActive)}>
        Notes
      </Link>
    </nav>
  );
}
