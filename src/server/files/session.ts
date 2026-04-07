import "server-only";

import { getCurrentAuthContext } from "@/server/auth/session";

export async function getAuthenticatedProfileId() {
  const context = await getCurrentAuthContext({ createProfile: true });
  return context?.profile.id ?? null;
}
