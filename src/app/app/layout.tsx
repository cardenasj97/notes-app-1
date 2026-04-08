import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getAppShellContext } from "@/server/orgs/context";

export const metadata: Metadata = {
  title: "Notes App 1",
  description: "Multi-tenant notes app",
};

function isNextRedirect(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  let context;
  try {
    context = await getAppShellContext();
  } catch (e) {
    // Re-throw Next.js redirect errors so they work normally (e.g. unauthenticated → sign-in).
    if (isNextRedirect(e)) throw e;
    const message = e instanceof Error ? e.message : "Unexpected error loading workspace.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
            Workspace unavailable
          </p>
          <p className="max-w-sm text-sm text-slate-400">{message}</p>
        </div>
      </main>
    );
  }

  return <AppShell context={context}>{children}</AppShell>;
}
