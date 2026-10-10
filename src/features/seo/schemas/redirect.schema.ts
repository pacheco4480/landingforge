import { z } from "zod";

const pathSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(/^\//, "Path must start with /")
  .refine(
    (value) => !value.startsWith("//"),
    "Path must be relative to this site.",
  )
  .refine(
    (value) => !value.includes("://"),
    "External URLs are not allowed here.",
  );

export const redirectSchema = z
  .object({
    id: z.string().uuid().optional(),
    fromPath: pathSchema,
    toPath: pathSchema,
    statusCode: z.coerce
      .number()
      .int()
      .refine((value) => value === 301 || value === 302, {
        message: "Redirect status must be 301 or 302.",
      }),
  })
  .refine((value) => value.fromPath !== value.toPath, {
    message: "Redirect source and destination must be different.",
    path: ["toPath"],
  });

export type RedirectInput = z.infer<typeof redirectSchema>;
