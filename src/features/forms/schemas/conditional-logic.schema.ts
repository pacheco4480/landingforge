import { z } from "zod";

export const conditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "empty",
  "not_empty",
]);

export const conditionalActionSchema = z.enum([
  "show",
  "hide",
  "require",
  "disable",
]);

export const conditionalLogicRuleSchema = z.object({
  field: z.string().trim().min(1).max(80),
  operator: conditionOperatorSchema,
  value: z.string().trim().max(200).optional(),
  action: conditionalActionSchema,
});

export const conditionalLogicSchema = z
  .array(conditionalLogicRuleSchema)
  .max(10)
  .default([]);

export type ConditionalLogicRule = z.infer<typeof conditionalLogicRuleSchema>;
