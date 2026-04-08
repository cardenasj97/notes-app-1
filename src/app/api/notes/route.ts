import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import { getOrganizationNotesPage, InvalidNotesCursorError } from "@/server/notes/service";
import { notePageSchema } from "@/server/notes/validation";

type RouteError = Error & { status?: number };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  try {
    const params = notePageSchema.parse({
      q: searchParams.get("q") ?? "",
      cursor: searchParams.get("cursor") ?? "",
      limit: searchParams.get("limit") ?? undefined,
    });
    const result = await getOrganizationNotesPage(organizationId, params.q, params.cursor, params.limit);
    return NextResponse.json(result);
  } catch (error) {
    const status =
      error instanceof ZodError || error instanceof InvalidNotesCursorError
        ? 400
        : typeof (error as RouteError).status === "number"
          ? (error as RouteError).status!
          : 500;

    logger.error("notes.page.failed", {
      organizationId,
      hasCursor: Boolean(searchParams.get("cursor")),
      cursor: searchParams.get("cursor")
        ? {
            value: searchParams.get("cursor"),
            q: searchParams.get("q") ?? "",
          }
        : null,
      error: error instanceof Error ? error.message : String(error),
      cause:
        error instanceof Error && "cause" in error
          ? String((error as Error & { cause?: unknown }).cause)
          : null,
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load notes" },
      { status },
    );
  }
}
