import { describe, expect, it } from "vitest";

import { buildStorageKey } from "../src/server/files/utils";

describe("buildStorageKey", () => {
  it("creates scoped org keys for org-only files", () => {
    const key = buildStorageKey({
      organizationId: "org-1",
      fileId: "file-1",
      originalName: "Quarterly Plan.pdf",
    });

    expect(key).toBe("orgs/org-1/org/file-1-Quarterly_Plan.pdf");
  });

  it("creates scoped note keys for note attachments", () => {
    const key = buildStorageKey({
      organizationId: "org-1",
      noteId: "note-1",
      fileId: "file-1",
      originalName: "image.png",
    });

    expect(key).toBe("orgs/org-1/notes/note-1/file-1-image.png");
  });
});
