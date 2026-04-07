import { z } from "zod";

export const fileUploadInputSchema = z.object({
  organizationId: z.string().uuid(),
  noteId: z.string().uuid().optional().nullable(),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export const fileDownloadInputSchema = z.object({
  fileId: z.string().uuid(),
});

export type FileUploadInput = z.infer<typeof fileUploadInputSchema>;
export type FileDownloadInput = z.infer<typeof fileDownloadInputSchema>;
