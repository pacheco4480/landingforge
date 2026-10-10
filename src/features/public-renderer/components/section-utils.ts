export function text(content: unknown, key: string, fallback = "") {
  if (!isRecord(content)) return fallback;
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function items(content: unknown) {
  if (!isRecord(content) || !Array.isArray(content.items)) return [];
  return content.items.filter(isRecord);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function itemText(
  item: Record<string, unknown>,
  key: string,
  fallback = "",
) {
  const value = item[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}
