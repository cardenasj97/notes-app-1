import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSupabaseUser } from "@/server/auth/session";
import { AutoRedirect } from "./_redirect";

export default async function ConfirmedPage() {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Notes App 1
          </p>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/15 ring-1 ring-cyan-400/40">
            <svg
              className="h-7 w-7 text-cyan-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Email confirmed!
            </h1>
            <p className="text-sm text-slate-400">
              You&apos;re signed in. Redirecting you to the app&hellip;
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Go to app
          </Link>
          <AutoRedirect />
        </div>
      </div>
    </main>
  );
}
