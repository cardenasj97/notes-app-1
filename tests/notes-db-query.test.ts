import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";
import { buildListAccessibleNotesQuery } from "@/server/notes/queries";

describe("listAccessibleNotes DB query", () => {
  const db = drizzle.mock({ schema });
  const organizationId = "455b550c-6122-4d3e-a8e9-560c2add1167";
  const userId = "4cd63c01-f27d-423d-8fd8-63dfc32b66e7";

  it("does not generate order by 0 desc when search is empty", () => {
    const query = buildListAccessibleNotesQuery(db, {
      organizationId,
      userId,
      search: "",
    }).toSQL();

    expect(query.sql).not.toContain("order by 0 desc");
    expect(query.sql).toContain('order by "notes"."updated_at" desc');
  });

  it("keeps rank ordering when search is present", () => {
    const query = buildListAccessibleNotesQuery(db, {
      organizationId,
      userId,
      search: "launch",
    }).toSQL();

    expect(query.sql).toContain("ts_rank(");
    expect(query.sql).toContain("order by");
    expect(query.sql).toContain('"notes"."updated_at" desc');
    expect(query.sql).not.toContain("order by 0 desc");
  });
});
