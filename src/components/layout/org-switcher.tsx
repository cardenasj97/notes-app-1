import { selectOrganizationAction } from "@/server/orgs/actions";
import type { OrganizationSummary } from "@/server/orgs/context";

export function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: Readonly<{
  organizations: OrganizationSummary[];
  activeOrganizationId: string | null;
}>) {
  return (
    <form action={selectOrganizationAction} className="space-y-3">
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Active organization
        </span>
        <select
          name="organizationId"
          defaultValue={activeOrganizationId ?? organizations[0]?.id ?? ""}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
        >
          {organizations.length === 0 ? (
            <option value="">No organizations yet</option>
          ) : (
            organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))
          )}
        </select>
      </label>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Switch
      </button>
    </form>
  );
}
