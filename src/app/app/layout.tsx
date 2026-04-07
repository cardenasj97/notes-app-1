import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getAppShellContext } from "@/server/orgs/context";

export const metadata: Metadata = {
  title: "Notes App 1",
  description: "Multi-tenant notes app",
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const context = await getAppShellContext();

  return <AppShell context={context}>{children}</AppShell>;
}
