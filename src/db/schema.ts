import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { AiSummary } from "@/lib/types";

export const organizationRoleEnum = pgEnum("organization_role", [
  "owner",
  "admin",
  "member",
]);

export const noteVisibilityEnum = pgEnum("note_visibility", [
  "private",
  "org",
  "shared",
]);

export const noteChangeSourceEnum = pgEnum("note_change_source", [
  "manual_edit",
  "ai_summary_accept",
]);

export const aiSummaryDraftStatusEnum = pgEnum("ai_summary_draft_status", [
  "draft",
  "accepted",
  "stale",
  "discarded",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("profiles_email_idx").on(table.email),
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("organizations_slug_idx").on(table.slug),
]);

export const memberships = pgTable("memberships", {
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  role: organizationRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.userId] }),
  index("memberships_user_idx").on(table.userId),
]);

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  visibility: noteVisibilityEnum("visibility").notNull().default("org"),
  currentVersionNumber: integer("current_version_number").notNull().default(1),
  acceptedSummary: jsonb("accepted_summary").$type<AiSummary | null>().default(null),
  searchDocument: text("search_document").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("notes_org_updated_idx").on(table.organizationId, table.updatedAt),
  index("notes_author_idx").on(table.authorId),
  index("notes_visibility_idx").on(table.visibility),
  index("notes_search_document_idx").using(
    "gin",
    sql`to_tsvector('english', ${table.searchDocument})`,
  ),
]);

export const noteVersions = pgTable("note_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  editedBy: uuid("edited_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  changeSource: noteChangeSourceEnum("change_source").notNull(),
  changedFields: jsonb("changed_fields").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  titleSnapshot: text("title_snapshot").notNull(),
  bodySnapshot: text("body_snapshot").notNull(),
  visibilitySnapshot: noteVisibilityEnum("visibility_snapshot").notNull(),
  tagsSnapshot: jsonb("tags_snapshot").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  sharedUserIdsSnapshot: jsonb("shared_user_ids_snapshot")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  acceptedSummarySnapshot: jsonb("accepted_summary_snapshot")
    .$type<AiSummary | null>()
    .default(null),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("note_versions_unique_version_idx").on(table.noteId, table.versionNumber),
  index("note_versions_note_idx").on(table.noteId, table.createdAt),
]);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tags_org_normalized_idx").on(table.organizationId, table.normalizedName),
]);

export const noteTagLinks = pgTable("note_tag_links", {
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.noteId, table.tagId] })]);

export const noteShares = pgTable("note_shares", {
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  grantedBy: uuid("granted_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.noteId, table.userId] }),
  index("note_shares_user_idx").on(table.userId),
]);

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  noteId: uuid("note_id").references(() => notes.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  bucket: text("bucket").notNull(),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("files_storage_key_idx").on(table.storageKey),
  index("files_note_idx").on(table.noteId),
  index("files_org_idx").on(table.organizationId),
]);

export const aiSummaryDrafts = pgTable("ai_summary_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  noteId: uuid("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  noteVersionId: uuid("note_version_id")
    .notNull()
    .references(() => noteVersions.id, { onDelete: "cascade" }),
  generatedBy: uuid("generated_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  model: text("model").notNull(),
  overview: text("overview").notNull(),
  keyPoints: jsonb("key_points").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  actionItems: jsonb("action_items").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  openQuestions: jsonb("open_questions").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  status: aiSummaryDraftStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("ai_summary_drafts_note_idx").on(table.noteId, table.createdAt),
  index("ai_summary_drafts_version_idx").on(table.noteVersionId),
]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  actorId: uuid("actor_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_events_org_idx").on(table.organizationId, table.createdAt),
  index("audit_events_actor_idx").on(table.actorId, table.createdAt),
]);

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [organizations.createdBy],
    references: [profiles.id],
  }),
  memberships: many(memberships),
  notes: many(notes),
  tags: many(tags),
  files: many(files),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(profiles, {
    fields: [memberships.userId],
    references: [profiles.id],
  }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [notes.organizationId],
    references: [organizations.id],
  }),
  author: one(profiles, {
    fields: [notes.authorId],
    references: [profiles.id],
  }),
  versions: many(noteVersions),
  shares: many(noteShares),
  tagLinks: many(noteTagLinks),
  files: many(files),
}));

export const noteVersionsRelations = relations(noteVersions, ({ one }) => ({
  note: one(notes, {
    fields: [noteVersions.noteId],
    references: [notes.id],
  }),
  editor: one(profiles, {
    fields: [noteVersions.editedBy],
    references: [profiles.id],
  }),
}));

export type OrganizationRole = (typeof organizationRoleEnum.enumValues)[number];
export type NoteVisibility = (typeof noteVisibilityEnum.enumValues)[number];
export type NoteChangeSource = (typeof noteChangeSourceEnum.enumValues)[number];
