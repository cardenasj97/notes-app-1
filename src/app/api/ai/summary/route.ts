import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getAuthenticatedProfileId } from "@/server/files/session";
import { generateAiSummary } from "@/server/ai/service";

export async function POST(request: Request) {
  try {
    const profileId = await getAuthenticatedProfileId();
    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const result = await generateAiSummary(payload, { userId: profileId });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("ai.summary.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI summary" },
      { status: 400 },
    );
  }
}
