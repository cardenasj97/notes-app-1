import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getAuthenticatedProfileId } from "@/server/files/session";
import { createFileDownloadUrl } from "@/server/files/service";

type RouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const profileId = await getAuthenticatedProfileId();
    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await context.params;
    const result = await createFileDownloadUrl({ fileId }, { userId: profileId });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("file.download.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create download URL" },
      { status: 400 },
    );
  }
}
