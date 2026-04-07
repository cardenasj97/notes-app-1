import { defineConfig } from "drizzle-kit";

import { getDatabaseUrl } from "./src/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: getDatabaseUrl() ?? "postgresql://postgres:postgres@localhost:5432/notes_app_1",
  },
  verbose: true,
  strict: true,
});
