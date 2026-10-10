const sensitiveKeyPattern =
  /password|token|secret|cookie|authorization|apikey|api_key|key|credential|session|csrf/i;

export function sanitizeMonitoringMetadata(value: unknown): unknown {
  return sanitizeValue(value, 0);
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 4) return "[Truncated]";
  if (value === null || value === undefined) return value;
  if (value instanceof Error) return sanitizeError(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return truncate(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value !== "object") return String(value);

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    sanitized[key] = sensitiveKeyPattern.test(key)
      ? "[Redacted]"
      : sanitizeValue(item, depth + 1);
  }
  return sanitized;
}

export function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: truncate(error.message),
      stack: truncateStack(error.stack),
    };
  }

  return { message: truncate(String(error)) };
}

export function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Erro operacional sem mensagem.";
}

export function monitoringFingerprint(input: {
  source: string;
  action?: string | null;
  message: string;
}) {
  return [input.source, input.action ?? "unknown", input.message]
    .join(":")
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .slice(0, 160);
}

function truncate(value: string, maxLength = 600) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function truncateStack(stack: string | undefined) {
  if (!stack) return undefined;
  return stack.split("\n").slice(0, 8).join("\n");
}
