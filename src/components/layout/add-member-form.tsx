"use client";

import { useActionState } from "react";

import { initialOrganizationActionState } from "@/server/orgs/action-state";
import { addMemberAction } from "@/server/orgs/actions";
import type { OrganizationSummary } from "@/server/orgs/context";
import type { OrganizationActionState } from "@/server/orgs/action-state";

export function AddMemberForm({
  organization,
}: Readonly<{
  organization: OrganizationSummary;
}>) {
  const [state, formAction, pending] = useActionState<OrganizationActionState, FormData>(
    addMemberAction,
    initialOrganizationActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="organizationId" value={organization.id} />
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Add member
        </label>
        <input
          name="email"
          type="email"
          placeholder="person@acme.com"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
        />
        <input
          name="displayName"
          type="text"
          placeholder="Display name"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
        />
        <select
          name="role"
          defaultValue="member"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <span className="min-h-5 text-xs text-rose-300">
          {state.fieldErrors?.email?.[0] ??
            state.fieldErrors?.displayName?.[0] ??
            state.fieldErrors?.role?.[0] ??
            state.message ??
            ""}
        </span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add member"}
      </button>
    </form>
  );
}
