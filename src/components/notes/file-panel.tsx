"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/server/supabase/browser";
import type { StoredFileSummary } from "@/server/files/types";

type FilePanelProps = {
  title: string;
  description: string;
  organizationId: string;
  noteId?: string | null;
  files: StoredFileSummary[];
};

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePanel({ title, description, organizationId, noteId = null, files }: FilePanelProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          noteId,
          originalName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to prepare file upload.");
      }

      if (!payload.token) {
        throw new Error("Storage is not configured for uploads yet.");
      }

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(payload.bucket)
        .uploadToSignedUrl(payload.storageKey, payload.token, selectedFile, {
          contentType: selectedFile.type || "application/octet-stream",
        });

      if (uploadError) {
        throw uploadError;
      }

      setSelectedFile(null);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(fileId: string) {
    setError(null);
    setDownloadingFileId(fileId);

    try {
      const response = await fetch(`/api/files/${fileId}/download`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create download URL.");
      }

      if (!payload.signedUrl) {
        throw new Error("Storage is not configured for downloads yet.");
      }

      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to download file.");
    } finally {
      setDownloadingFileId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{title}</p>
        <p className="text-sm leading-6 text-zinc-600">{description}</p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload file"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {files.length ? (
          files.map((file) => (
            <div
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{file.originalName}</p>
                <p className="text-xs text-zinc-500">
                  {file.mimeType} · {formatBytes(file.sizeBytes)} ·{" "}
                  {new Date(file.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(file.id)}
                disabled={downloadingFileId === file.id}
                className="rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingFileId === file.id ? "Preparing..." : "Download"}
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
            No files uploaded yet.
          </div>
        )}
      </div>
    </section>
  );
}
