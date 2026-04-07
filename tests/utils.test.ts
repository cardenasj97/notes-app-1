import { describe, expect, it } from "vitest";

import { normalizeTag, slugify } from "@/lib/utils";

describe("utility helpers", () => {
  it("slugifies organization names", () => {
    expect(slugify(" Acme Notes Inc ")).toBe("acme-notes-inc");
  });

  it("normalizes tags", () => {
    expect(normalizeTag("  Product  Launch ")).toBe("product launch");
  });
});
