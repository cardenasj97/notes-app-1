import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "@/lib/env";

import * as schema from "./schema";

declare global {
  var __notesAppSqlClient: postgres.Sql | undefined;
  var __notesAppDb: PostgresJsDatabase<typeof schema> | undefined;
}

export function hasDatabaseConfig() {
  return Boolean(getDatabaseUrl());
}

export function getDb() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to use the database.");
  }

  if (!global.__notesAppSqlClient) {
    global.__notesAppSqlClient = postgres(databaseUrl, {
      prepare: false,
      max: process.env.NODE_ENV === "production" ? 10 : 1,
    });
  }

  if (!global.__notesAppDb) {
    global.__notesAppDb = drizzle(global.__notesAppSqlClient, {
      schema,
      logger: process.env.NODE_ENV === "development",
    });
  }

  return global.__notesAppDb;
}
