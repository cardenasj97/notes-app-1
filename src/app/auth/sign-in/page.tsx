import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentSupabaseUser } from "@/server/auth/session";
import { getMissingCoreConfig } from "@/lib/env";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await getCurrentSupabaseUser();

  if (user) {
    redirect("/app");
  }

  const missing = getMissingCoreConfig();
  const params = await searchParams;
  const errorMsg = params.error ?? null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="max-w-xl space-y-6 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              Notes App 1
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-white">
              Notes for teams that need hard tenant boundaries.
            </h1>
            <p className="text-lg leading-8 text-slate-300">
              Sign in to switch organizations, manage members, and work inside a
              server-checked workspace.
            </p>
            {missing.length > 0 ? (
              <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                Missing env values: {missing.join(", ")}
              </p>
            ) : null}
            <p className="text-sm text-slate-400">
              New here?{" "}
              <Link className="text-cyan-300 hover:text-cyan-200" href="/auth/sign-up">
                Create an account
              </Link>
            </p>
          </section>

          <AuthCard
            eyebrow="Sign in"
            title="Welcome back"
            description="Use your organization account to continue."
          >
            {errorMsg ? (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {errorMsg}
              </p>
            ) : null}
            <SignInForm />
          </AuthCard>
        </div>
      </div>
    </main>
  );
}
