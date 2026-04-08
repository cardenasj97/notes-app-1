import { z } from "zod";

export const noteVisibilitySchema = z.enum(["private", "org", "shared"]);

export const noteFormSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(50_000),
  visibility: noteVisibilitySchema,
  tags: z
    .string()
    .max(500, "Tags input is too long.")
    .optional()
    .default("")
    .refine(
      (val) => parseList(val).length <= 10,
      "A note can have at most 10 tags.",
    )
    .refine(
      (val) => parseList(val).every((tag) => tag.length <= 30),
      "Each tag can be at most 30 characters.",
    ),
  sharedUserIds: z.string().optional().default(""),
});

export const noteSearchSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
});

export const notePageSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  cursor: z.string().trim().optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;
export type NoteSearchValues = z.infer<typeof noteSearchSchema>;
export type NotePageValues = z.infer<typeof notePageSchema>;

export function parseList(value: string | undefined | null) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
