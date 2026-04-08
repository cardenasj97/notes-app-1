import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";
import { buildListAccessibleNotesPageQuery } from "@/server/notes/queries";

describe("listAccessibleNotes DB query", () => {
  const db = drizzle.mock({ schema });
  const organizationId = "455b550c-6122-4d3e-a8e9-560c2add1167";
  const userId = "4cd63c01-f27d-423d-8fd8-63dfc32b66e7";
  const baseInput = {
    organizationId,
    userId,
    limit: 24,
  };

  it("does not generate order by 0 desc when search is empty", () => {
    const query = buildListAccessibleNotesPageQuery(db, {
      ...baseInput,
      search: "",
      cursor: null,
    }).toSQL();

    expect(query.sql).not.toContain("order by 0 desc");
    expect(query.sql).toContain('order by "notes"."updated_at" desc, "notes"."id" desc');
  });

  it("keeps rank ordering when search is present", () => {
    const query = buildListAccessibleNotesPageQuery(db, {
      ...baseInput,
      search: "launch",
      cursor: null,
    }).toSQL();

    expect(query.sql).toContain("ts_rank(");
    expect(query.sql).toContain("order by");
    expect(query.sql).toContain('"notes"."updated_at" desc');
    expect(query.sql).not.toContain("order by 0 desc");
  });

  it("applies limit plus one rows for cursor pagination", () => {
    const query = buildListAccessibleNotesPageQuery(db, {
      ...baseInput,
      search: "",
      cursor: null,
    }).toSQL();

    expect(query.sql).toContain("limit $");
    expect(query.params.at(-1)).toBe(25);
  });

  it("adds a stable no-search cursor predicate", () => {
    const query = buildListAccessibleNotesPageQuery(db, {
      ...baseInput,
      search: "",
      cursor: {
        updatedAt: "2026-04-08T15:00:00.000Z",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
    }).toSQL();

    expect(query.sql).toContain('"notes"."updated_at" < $');
    expect(query.sql).toContain('"notes"."id" < $');
    expect(query.sql).toContain("::timestamptz");
    expect(query.sql).toContain("::uuid");
  });

  it("adds a stable search cursor predicate", () => {
    const query = buildListAccessibleNotesPageQuery(db, {
      ...baseInput,
      search: "launch",
      cursor: {
        score: 0.42,
        updatedAt: "2026-04-08T15:00:00.000Z",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
    }).toSQL();

    expect(query.sql).toContain("ts_rank(");
    expect(query.sql).toContain('< $');
    expect(query.sql).toContain('"notes"."id" < $');
    expect(query.sql).toContain('"notes"."updated_at" = $');
    expect(query.sql).toContain("::double precision");
    expect(query.sql).toContain("::timestamptz");
    expect(query.sql).toContain("::uuid");
  });
});
