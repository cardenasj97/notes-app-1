import { z } from "zod";

import { aiSummarySchema, aiSummarySelectionSchema } from "@/lib/types";

export const generateAiSummaryInputSchema = z.object({
  noteId: z.string().uuid(),
  noteVersionId: z.string().uuid(),
});

export const acceptAiSummaryInputSchema = z.object({
  draftId: z.string().uuid(),
  selection: aiSummarySelectionSchema,
});

export const generatedAiSummaryResponseSchema = aiSummarySchema;

export type GenerateAiSummaryInput = z.infer<typeof generateAiSummaryInputSchema>;
export type AcceptAiSummaryInput = z.infer<typeof acceptAiSummaryInputSchema>;
