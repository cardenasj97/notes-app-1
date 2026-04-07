"use client";

import { useActionState } from "react";

import { initialAuthActionState } from "@/server/auth/action-state";
import { signInAction } from "@/server/auth/actions";
import type { AuthActionState } from "@/server/auth/action-state";

export function SignInForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    signInAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <FieldError message={state.message} />
      <Field label="Email" name="email" type="email" error={state.fieldErrors?.email?.[0]} />
      <Field
        label="Password"
        name="password"
        type="password"
        error={state.fieldErrors?.password?.[0]}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  error,
}: Readonly<{
  label: string;
  name: string;
  type: string;
  error?: string;
}>) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        name={name}
        type={type}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300/60"
      />
      <span className="min-h-5 text-xs text-rose-300">{error ?? ""}</span>
    </label>
  );
}

function FieldError({ message }: Readonly<{ message?: string }>) {
  return message ? (
    <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      {message}
    </p>
  ) : null;
}
