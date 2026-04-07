import { signOutAction } from "@/server/auth/actions";

export function SignOutForm() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
      >
        Sign out
      </button>
    </form>
  );
}
