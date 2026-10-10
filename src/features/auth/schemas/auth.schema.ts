import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
});
