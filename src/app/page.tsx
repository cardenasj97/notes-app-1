import { redirect } from "next/navigation";

import { getCurrentSupabaseUser } from "@/server/auth/session";

export default async function Home() {
  const user = await getCurrentSupabaseUser();

  if (user) {
    redirect("/app");
  }

  redirect("/auth/sign-in");
}
