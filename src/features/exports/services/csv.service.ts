export function csvCell(value: unknown) {
  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "string"
        ? value
        : value == null
          ? ""
          : String(value);
  const sanitized = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${sanitized.replaceAll('"', '""')}"`;
}

export function toCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
