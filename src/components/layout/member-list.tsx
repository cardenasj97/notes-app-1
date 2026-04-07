import type { OrganizationMemberSummary } from "@/server/orgs/context";

export function MemberList({
  members,
}: Readonly<{
  members: OrganizationMemberSummary[];
}>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Members
        </h2>
        <span className="text-xs text-slate-500">{members.length}</span>
      </div>
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-400">
            No members yet.
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.userId}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {member.displayName}
                    {member.isCurrentUser ? " (you)" : ""}
                  </p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  {member.role}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
