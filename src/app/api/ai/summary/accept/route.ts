import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getAuthenticatedProfileId } from "@/server/files/session";
import { acceptAiSummary } from "@/server/ai/service";

export async function POST(request: Request) {
  try {
    const profileId = await getAuthenticatedProfileId();
    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const result = await acceptAiSummary(payload, { userId: profileId });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("ai.summary.accept.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept AI summary" },
      { status: 400 },
    );
  }
}
