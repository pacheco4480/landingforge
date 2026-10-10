import { FormFieldType } from "@/generated/prisma/client";
import { conditionalLogicSchema } from "@/features/forms/schemas/conditional-logic.schema";
import { z } from "zod";

const optionSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(80),
});

export const fieldValidationSchema = z
  .object({
    minLength: z.coerce.number().int().min(0).optional().or(z.literal("")),
    maxLength: z.coerce.number().int().min(1).optional().or(z.literal("")),
    min: z.coerce.number().optional().or(z.literal("")),
    max: z.coerce.number().optional().or(z.literal("")),
    regex: z.string().trim().max(300).optional(),
    message: z.string().trim().max(160).optional(),
  })
  .refine(
    (value) =>
      value.minLength === "" ||
      value.maxLength === "" ||
      value.minLength === undefined ||
      value.maxLength === undefined ||
      value.minLength <= value.maxLength,
    { message: "Minimum length cannot exceed maximum length." },
  )
  .refine(
    (value) =>
      value.min === "" ||
      value.max === "" ||
      value.min === undefined ||
      value.max === undefined ||
      value.min <= value.max,
    { message: "Minimum value cannot exceed maximum value." },
  )
  .refine(
    (value) => {
      if (!value.regex) return true;
      try {
        new RegExp(value.regex);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Regex must be valid." },
  );

export const formFieldSchema = z.object({
  id: z.string().uuid().optional(),
  formId: z.string().uuid(),
  label: z.string().trim().min(1).max(120),
  name: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/),
  type: z.enum(FormFieldType),
  placeholder: z.string().trim().max(160).optional(),
  helpText: z.string().trim().max(240).optional(),
  defaultValue: z.string().trim().max(500).optional(),
  options: z.array(optionSchema).max(30).default([]),
  validation: fieldValidationSchema.default({}),
  conditionalLogic: conditionalLogicSchema,
  isRequired: z.coerce.boolean(),
  isVisible: z.coerce.boolean(),
});

export type FormFieldInput = z.infer<typeof formFieldSchema>;
