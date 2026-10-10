import { z } from "zod";

export const submissionContextSchema = z.object({
  formId: z.string().uuid(),
  pageId: z.string().uuid().optional().nullable(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

export type SubmissionContext = z.infer<typeof submissionContextSchema>;
