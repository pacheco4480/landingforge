import type { ConditionalLogicRule } from "@/features/forms/schemas/conditional-logic.schema";

export function evaluateConditionalRule(
  rule: ConditionalLogicRule,
  values: Record<string, unknown>,
) {
  const currentValue = values[rule.field];
  const text = currentValue == null ? "" : String(currentValue);
  const expected = rule.value ?? "";

  if (rule.operator === "equals") return text === expected;
  if (rule.operator === "not_equals") return text !== expected;
  if (rule.operator === "contains") return text.includes(expected);
  if (rule.operator === "empty") return text.length === 0;
  if (rule.operator === "not_empty") return text.length > 0;
  return false;
}
