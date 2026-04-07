import "server-only";

import { randomUUID } from "crypto";

import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

import { getDb, hasDatabaseConfig } from "@/db/client";
import { files } from "@/db/schema";
import { getStorageBucketName, getPublicSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import { recordAuditEvent } from "@/server/audit/service";

import {
  canAccessFile,
  canUploadToOrganization,
} from "./permissions";
import { fileDownloadInputSchema, fileUploadInputSchema, type FileUploadInput } from "./types";
import { buildStorageKey } from "./utils";

type AuthContext = {
  userId: string;
};

function getServiceSupabase() {
  const config = getPublicSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!config || !serviceRoleKey) {
    return null;
  }

  return createClient(config.url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function prepareFileUpload(input: FileUploadInput, auth: AuthContext) {
  const parsed = fileUploadInputSchema.parse(input);

  if (!(await canUploadToOrganization(auth.userId, parsed.organizationId))) {
    throw new Error("Unauthorized to upload files to this organization.");
  }

  const fileId = randomUUID();
  const storageKey = buildStorageKey({
    organizationId: parsed.organizationId,
    noteId: parsed.noteId ?? null,
    fileId,
    originalName: parsed.originalName,
  });

  const bucket = getStorageBucketName();
  const client = getServiceSupabase();

  if (!client) {
    return {
      fileId,
      bucket,
      storageKey,
      signedUploadUrl: null,
      signedDownloadUrl: null,
    };
  }

  const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(storageKey);

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  const db = hasDatabaseConfig() ? getDb() : null;
  if (db) {
    await db.insert(files).values({
      id: fileId,
      organizationId: parsed.organizationId,
      noteId: parsed.noteId ?? null,
      uploadedBy: auth.userId,
      bucket,
      storageKey,
      originalName: parsed.originalName,
      mimeType: parsed.mimeType,
      sizeBytes: parsed.sizeBytes,
    });
  }

  await recordAuditEvent({
    organizationId: parsed.organizationId,
    actorId: auth.userId,
    eventType: "file.upload.prepared",
    entityType: "file",
    entityId: fileId,
    payload: {
      noteId: parsed.noteId ?? null,
      storageKey,
      bucket,
    },
  });

  logger.info("file.upload.prepared", {
    organizationId: parsed.organizationId,
    actorId: auth.userId,
    entityId: fileId,
    noteId: parsed.noteId ?? null,
  });

  return {
    fileId,
    bucket,
    storageKey,
    signedUploadUrl: data.signedUrl,
    token: data.token,
  };
}

export async function createFileDownloadUrl(input: { fileId: string }, auth: AuthContext) {
  const parsed = fileDownloadInputSchema.parse(input);

  if (!(await canAccessFile(auth.userId, parsed.fileId))) {
    throw new Error("Unauthorized to access this file.");
  }

  const db = getDb();
  const rows = await db
    .select({
      bucket: files.bucket,
      storageKey: files.storageKey,
      organizationId: files.organizationId,
      noteId: files.noteId,
    })
    .from(files)
    .where(eq(files.id, parsed.fileId))
    .limit(1);

  const file = rows[0];
  if (!file) {
    throw new Error("File not found.");
  }

  const client = getServiceSupabase();
  if (!client) {
    return {
      bucket: file.bucket,
      storageKey: file.storageKey,
      signedUrl: null,
    };
  }

  const { data, error } = await client.storage.from(file.bucket).createSignedUrl(file.storageKey, 60);
  if (error) {
    throw new Error(`Failed to create signed download URL: ${error.message}`);
  }

  await recordAuditEvent({
    organizationId: file.organizationId,
    actorId: auth.userId,
    eventType: "file.download.url.created",
    entityType: "file",
    entityId: parsed.fileId,
    payload: {
      noteId: file.noteId ?? null,
      storageKey: file.storageKey,
    },
  });

  logger.info("file.download.url.created", {
    organizationId: file.organizationId,
    actorId: auth.userId,
    entityId: parsed.fileId,
  });

  return {
    bucket: file.bucket,
    storageKey: file.storageKey,
    signedUrl: data.signedUrl,
  };
}
