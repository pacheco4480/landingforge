import { z } from "zod";

export const prospectCsvHeaders = [
  "businessName",
  "contactName",
  "email",
  "phone",
  "industry",
  "locality",
  "website",
  "publicProfileUrl",
  "sourceUrl",
  "factualNotes",
] as const;

export type ProspectCsvHeader = (typeof prospectCsvHeaders)[number];

export const prospectCsvRowSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().max(120).optional().default(""),
  email: z.union([z.email().max(254), z.literal("")]).optional().default(""),
  phone: z.string().trim().max(50).optional().default(""),
  industry: z.string().trim().max(80).optional().default(""),
  locality: z.string().trim().max(120).optional().default(""),
  website: z.union([z.url().max(500).refine(isHttpUrl), z.literal("")]).optional().default(""),
  publicProfileUrl: z.union([z.url().max(500).refine(isHttpUrl), z.literal("")]).optional().default(""),
  sourceUrl: z.union([z.url().max(1000).refine(isHttpUrl), z.literal("")]).optional().default(""),
  factualNotes: z.string().trim().max(3000).optional().default(""),
});

function isHttpUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

export type ProspectCsvRow = z.infer<typeof prospectCsvRowSchema>;

export function sanitizeProspectCsvPreviewRow(input: unknown): Partial<ProspectCsvRow> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const record = input as Record<string, unknown>;
  const preview: Partial<ProspectCsvRow> = {};
  if (typeof record.businessName === "string") preview.businessName = record.businessName.slice(0, 160);
  if (typeof record.email === "string") preview.email = record.email.slice(0, 254);
  return preview;
}

export function normalizeProspectEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

export function normalizeBusinessDomain(website?: string | null) {
  if (!website?.trim()) return null;
  try {
    const url = new URL(website.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return hostname || null;
  } catch {
    return null;
  }
}

export function normalizeSuppressionValue(type: "EMAIL" | "DOMAIN", value: string) {
  const normalized = value.trim().toLowerCase();
  if (type === "EMAIL") return z.email().safeParse(normalized).success ? normalized : null;
  const hostname = normalizeBusinessDomain(/^[a-z][a-z\d+.-]*:\/\//i.test(normalized) ? normalized : `https://${normalized}`);
  return hostname && /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(hostname) ? hostname : null;
}

export function normalizeEmailDomain(email?: string | null) {
  const normalized = normalizeProspectEmail(email);
  return normalized?.split("@")[1] || null;
}

export function buildApprovedPublicDemoUrl(siteUrl: string | undefined, slug: string) {
  if (!siteUrl || !slug) return null;
  try {
    const url = new URL(siteUrl);
    if (url.protocol !== "https:" || /^(localhost|127\.|10\.|192\.168\.)/i.test(url.hostname)) return null;
    return `${url.origin}/templates/${encodeURIComponent(slug)}`;
  } catch {
    return null;
  }
}

export function getProspectCopyBlockReason(input: {
  status: string;
  suppressed: boolean;
  recipient: string | null;
  sourceUrl: string | null;
  verifiedAt: Date | null;
  subject: string;
  body: string;
}) {
  if (input.status === "DO_NOT_CONTACT" || input.suppressed) return "A supressão impede a exportação deste rascunho.";
  if (!input.recipient) return "O prospect não tem email profissional.";
  if (!input.sourceUrl || !input.verifiedAt) return "Confirma uma fonte pública e a data de verificação dos dados antes de copiar a mensagem.";
  if (findTemplatePlaceholders(`${input.subject}\n${input.body}`).length) return "Resolve todos os campos {{placeholder}} antes de exportar.";
  return null;
}

export function parseCsv(source: string, maxRows = 500): string[][] {
  if (source.length > 500_000) throw new Error("O ficheiro CSV excede o limite de 500 KB.");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item.trim())) rows.push(row);
      if (rows.length > maxRows + 1) throw new Error(`O CSV excede o limite de ${maxRows} registos.`);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("O CSV contém um campo entre aspas sem fecho.");
  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  if (rows.length > maxRows + 1) throw new Error(`O CSV excede o limite de ${maxRows} registos.`);
  return rows;
}

export const prospectTemplatePlaceholders = [
  "businessName",
  "contactName",
  "locality",
  "industry",
  "website",
  "publicDemoUrl",
] as const;

export function findTemplatePlaceholders(value: string) {
  return [...value.matchAll(/\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g)].map((match) => match[1]!);
}

export function renderProspectTemplate(
  value: string,
  fields: Partial<Record<(typeof prospectTemplatePlaceholders)[number], string>>,
) {
  return value.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g, (token, key: string) => {
    if (!(prospectTemplatePlaceholders as readonly string[]).includes(key)) return token;
    return fields[key as (typeof prospectTemplatePlaceholders)[number]] || token;
  });
}
