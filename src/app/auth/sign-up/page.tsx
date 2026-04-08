import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentAuthContext } from "@/server/auth/session";

export default async function SignUpPage() {
  const context = await getCurrentAuthContext().catch(() => null);

  if (context) {
    redirect("/app");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.16),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="max-w-xl space-y-6 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
              Notes App 1
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-white">
              Create your workspace account.
            </h1>
            <p className="text-lg leading-8 text-slate-300">
              Keep the model simple: one app, strong org boundaries, and server-side
              checks on every sensitive path.
            </p>
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link className="text-violet-300 hover:text-violet-200" href="/auth/sign-in">
                Sign in
              </Link>
            </p>
          </section>

          <AuthCard
            eyebrow="Sign up"
            title="Start a workspace"
            description="Create the account, then create your first organization."
          >
            <SignUpForm />
          </AuthCard>
        </div>
      </div>
    </main>
  );
}
