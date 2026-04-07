"use client";

import { useActionState } from "react";

import { initialOrganizationActionState } from "@/server/orgs/action-state";
import { createOrganizationAction } from "@/server/orgs/actions";
import type { OrganizationActionState } from "@/server/orgs/action-state";

export function CreateOrgForm() {
  const [state, formAction, pending] = useActionState<OrganizationActionState, FormData>(
    createOrganizationAction,
    initialOrganizationActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Create organization
        </label>
        <input
          name="name"
          placeholder="Acme Notes"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
        />
        <span className="min-h-5 text-xs text-rose-300">{state.fieldErrors?.name?.[0] ?? state.message ?? ""}</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create org"}
      </button>
    </form>
  );
}
