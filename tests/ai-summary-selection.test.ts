import { describe, expect, it } from "vitest";

import { aiSummarySchema } from "../src/lib/types";

describe("ai summary schema", () => {
  it("accepts a structured summary shape", () => {
    const summary = aiSummarySchema.parse({
      overview: "Short overview",
      keyPoints: ["A", "B"],
      actionItems: ["Do thing"],
      openQuestions: [],
    });

    expect(summary.overview).toBe("Short overview");
    expect(summary.keyPoints).toHaveLength(2);
  });
});
