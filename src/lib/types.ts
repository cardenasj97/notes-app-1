import { z } from "zod";

export const aiSummarySchema = z.object({
  overview: z.string().trim().min(1),
  keyPoints: z.array(z.string().trim().min(1)).default([] as string[]),
  actionItems: z.array(z.string().trim().min(1)).default([] as string[]),
  openQuestions: z.array(z.string().trim().min(1)).default([] as string[]),
});

export const aiSummarySelectionSchema = z.object({
  overview: z.boolean().default(false),
  keyPoints: z.boolean().default(false),
  actionItems: z.boolean().default(false),
  openQuestions: z.boolean().default(false),
});

export type AiSummary = z.infer<typeof aiSummarySchema>;
export type AiSummarySelection = z.infer<typeof aiSummarySelectionSchema>;
