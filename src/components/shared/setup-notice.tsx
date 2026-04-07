import Link from "next/link";

import { getMissingCoreConfig } from "@/lib/env";

import { Panel } from "./panel";

export function SetupNotice() {
  const missing = getMissingCoreConfig();

  if (!missing.length) {
    return null;
  }

  return (
    <Panel className="mx-auto max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-foreground-muted">
        Setup required
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        Add the required environment variables to enable the app.
      </h2>
      <p className="mt-3 text-sm text-foreground-muted">
        Copy <code>.env.example</code> to <code>.env.local</code> and fill in:
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {missing.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-panel-strong px-3 py-1 text-xs font-medium"
          >
            {item}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-foreground-muted">
        The repo includes the build, schema, auth, search, files, AI, and deploy paths, but live data
        features need configured Supabase and Postgres credentials.
      </p>
      <Link
        className="mt-5 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
        href="/auth/sign-in"
      >
        Open the auth flow
      </Link>
    </Panel>
  );
}
