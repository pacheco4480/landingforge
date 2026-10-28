export type ClientPackageMode = "LANDING_ONLY" | "LANDING_WITH_CMS";

export type ClientPackageCategory =
  | "frontend"
  | "assets"
  | "seo"
  | "forms"
  | "deployment"
  | "client-documentation"
  | "cms"
  | "auth"
  | "database"
  | "migrations";

export type ClientPackageEntry = {
  path: string;
  category: ClientPackageCategory;
  content?: string | Uint8Array;
  sizeBytes?: number;
  symbolicLink?: boolean;
};

export type ClientPackageFinding = {
  code:
    | "INVALID_MANIFEST"
    | "INVALID_MODE"
    | "INVALID_ENTRY"
    | "INVALID_CATEGORY"
    | "INVALID_PATH"
    | "DUPLICATE_PATH"
    | "SYMBOLIC_LINK"
    | "DENIED_PATH"
    | "UNALLOWLISTED_PATH"
    | "CATEGORY_NOT_ALLOWED"
    | "SECRET_DETECTED"
    | "FILE_TOO_LARGE"
    | "PACKAGE_TOO_LARGE"
    | "TOO_MANY_FILES"
    | "CONTENT_NOT_INSPECTED"
    | "MISSING_CATEGORY"
    | "BUILD_NOT_VERIFIED"
    | "TENANT_ISOLATION_NOT_VERIFIED";
  path?: string;
  message: string;
};

export type ClientPackageAuditInput = {
  mode: ClientPackageMode;
  entries: readonly ClientPackageEntry[];
  isolatedBuildPassed: boolean;
  tenantIsolationPassed?: boolean;
};

export type ClientPackageAudit = {
  format: "landingforge-client-package-audit";
  formatVersion: 1;
  policyVersion: 1;
  ready: boolean;
  fileCount: number;
  totalBytes: number;
  findings: ClientPackageFinding[];
};

const MAX_FILES = 10_000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 200 * 1024 * 1024;

const landingOnlyCategories = new Set<ClientPackageCategory>([
  "frontend",
  "assets",
  "seo",
  "forms",
  "deployment",
  "client-documentation",
]);

const cmsCategories = new Set<ClientPackageCategory>([
  ...landingOnlyCategories,
  "cms",
  "auth",
  "database",
  "migrations",
]);

const deniedPathSegments = new Set([
  ".git",
  ".next",
  ".env",
  "node_modules",
  "prompts",
  "tasks",
  "portfolio",
  "backups",
  "logs",
]);

const deniedPathPatterns = [
  /^docs?(?:\/|$)/i,
  /^src\/features\/(?:clients|projects|exports|briefings?|crm|ai)(?:\/|$)/i,
  /^prisma\/seeds?(?:\/|$)/i,
  /^app\/\(protected\)(?:\/|$)/i,
  /^app\/(?:\(protected\)|admin|dashboard|login|settings|leads|projects|clients)(?:\/|$)/i,
  /(?:^|\/)(?:AGENTS\.md|TASKS_MASTER_PLAN\.md|TECHNICAL_DEBT\.md|DECISION_LOG\.md)$/i,
];

const allowedDestinationPaths: Record<ClientPackageCategory, readonly (string | RegExp)[]> = {
  frontend: [
    /^app\/(?:page|layout)\.[cm]?[jt]sx?$/i,
    /^app\/actions\.[cm]?[jt]s$/i,
    /^app\/(?:politica-privacidade|politica-cookies|termos-condicoes)\/page\.[cm]?[jt]sx?$/i,
    /^app\/cms(?:\/|$)/i,
    /^app\/api\/auth\/\[\.\.\.nextauth\]\/route\.[cm]?[jt]s$/i,
    /^app\/(?:globals\.css|robots\.[cm]?[jt]s|sitemap\.[cm]?[jt]s)$/i,
    /^src\/client-runtime\//i,
    /^src\/client-runtime-payload\.json$/i,
  ],
  assets: [/^public\//i],
  seo: [/^seo\//i],
  forms: [/^forms\//i],
  deployment: [
    /^deployment\//i,
    /^scripts\/client-cms-bootstrap\.ts$/i,
    /^(?:\.env\.example|package(?:-lock)?\.json|next\.config\.[cm]?[jt]s|tsconfig\.json|postcss\.config\.[cm]?[jt]s)$/i,
  ],
  "client-documentation": [/^client-docs\//i],
  cms: [/^cms\//i],
  auth: [/^auth\//i],
  database: [/^database\//i],
  migrations: [/^migrations\//i],
};

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /(?:DATABASE_URL|DIRECT_URL|AUTH_SECRET|CRON_SECRET|RESEND_API_KEY|TURNSTILE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY)[ \t]*[:=][ \t]*[^\s"']+/i,
  /\bsb_secret_[A-Za-z0-9_-]{12,}\b/,
  /\bre_[A-Za-z0-9_-]{16,}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
];

function normalizedPath(path: string) {
  const portablePath = path.replaceAll("\\", "/");
  if (
    !portablePath ||
    portablePath.includes("\0") ||
    portablePath.startsWith("/") ||
    /^[A-Za-z]:/.test(portablePath) ||
    portablePath.split("/").some((segment) => segment === ".." || segment === ".")
  ) {
    return null;
  }
  return portablePath.replace(/\/+$/, "");
}

function contentSize(entry: ClientPackageEntry) {
  if (typeof entry.content === "string") return Buffer.byteLength(entry.content, "utf8");
  const size = entry.content?.byteLength ?? entry.sizeBytes ?? 0;
  return Number.isFinite(size) && size >= 0 ? size : Number.POSITIVE_INFINITY;
}

export function containsSecretMaterial(content: ClientPackageEntry["content"]) {
  let text: string;
  if (typeof content === "string") {
    text = content;
  } else if (content) {
    text = new TextDecoder("latin1").decode(content);
  } else {
    return false;
  }
  return secretPatterns.some((pattern) => pattern.test(text));
}

function isAllowlistedDestination(path: string, category: ClientPackageCategory) {
  const patterns = allowedDestinationPaths[category];
  return Boolean(patterns?.some((pattern) =>
    typeof pattern === "string" ? path === pattern : pattern.test(path),
  ));
}

function isDeniedPath(path: string, mode: ClientPackageMode) {
  if (deniedPathPatterns.some((pattern) => pattern.test(path))) return true;
  if (/^app\/cms(?:\/|$)/i.test(path) || /^src\/client-runtime\/features\/exports\/client-runtime\/cms(?:\/|$)/i.test(path)) {
    return mode !== "LANDING_WITH_CMS";
  }
  if (!/^app\/api(?:\/|$)/i.test(path)) return false;
  return mode !== "LANDING_WITH_CMS" ||
    !/^app\/api\/auth\/\[\.\.\.nextauth\]\/route\.[cm]?[jt]s$/i.test(path);
}

function requiredCategories(mode: ClientPackageMode | undefined) {
  const required: ClientPackageCategory[] = ["frontend", "deployment"];
  if (mode === "LANDING_WITH_CMS") {
    required.push("cms", "auth", "database", "migrations");
  }
  return required;
}

export function auditClientPackage(input: unknown): ClientPackageAudit {
  const findings: ClientPackageFinding[] = [];
  const candidate = input && typeof input === "object" ? input as Partial<ClientPackageAuditInput> : null;
  const mode = candidate?.mode;
  const entries = candidate?.entries;
  if (!candidate || !Array.isArray(entries) || typeof candidate.isolatedBuildPassed !== "boolean") {
    findings.push({ code: "INVALID_MANIFEST", message: "O manifesto de exportação não tem um formato válido." });
  }
  if (mode !== "LANDING_ONLY" && mode !== "LANDING_WITH_CMS") {
    findings.push({ code: "INVALID_MODE", message: "O modo de entrega não é reconhecido." });
  }
  const allowedCategories = mode === "LANDING_ONLY"
    ? landingOnlyCategories
    : mode === "LANDING_WITH_CMS"
      ? cmsCategories
      : new Set<ClientPackageCategory>();
  const categories = new Set<ClientPackageCategory>();
  const seenPaths = new Set<string>();
  let totalBytes = 0;
  const validEntries = Array.isArray(entries) ? entries : [];

  if (validEntries.length > MAX_FILES) {
    findings.push({ code: "TOO_MANY_FILES", message: `O pacote excede o limite de ${MAX_FILES} ficheiros.` });
  }

  for (const candidateEntry of validEntries) {
    if (!candidateEntry || typeof candidateEntry !== "object") {
      findings.push({ code: "INVALID_ENTRY", message: "O manifesto contém uma entrada de ficheiro inválida." });
      continue;
    }
    const entry = candidateEntry as ClientPackageEntry;
    if (
      typeof entry.path !== "string" ||
      typeof entry.category !== "string" ||
      (entry.content !== undefined && typeof entry.content !== "string" && !(entry.content instanceof Uint8Array)) ||
      (entry.symbolicLink !== undefined && typeof entry.symbolicLink !== "boolean")
    ) {
      findings.push({
        code: "INVALID_ENTRY",
        path: typeof entry.path === "string" ? entry.path : undefined,
        message: "A entrada do manifesto não respeita o contrato de ficheiro exportável.",
      });
      continue;
    }
    if (!Object.hasOwn(allowedDestinationPaths, entry.category)) {
      findings.push({ code: "INVALID_CATEGORY", path: entry.path, message: "A categoria do ficheiro não é reconhecida." });
      continue;
    }
    const path = normalizedPath(entry.path);
    if (!path) {
      findings.push({ code: "INVALID_PATH", path: entry.path, message: "O caminho do ficheiro não é relativo ou contém segmentos inválidos." });
      continue;
    }

    const pathKey = path.toLowerCase();
    if (seenPaths.has(pathKey)) {
      findings.push({ code: "DUPLICATE_PATH", path, message: "O manifesto contém caminhos duplicados." });
    }
    seenPaths.add(pathKey);

    if (entry.symbolicLink) {
      findings.push({ code: "SYMBOLIC_LINK", path, message: "Links simbólicos não são permitidos no pacote." });
    }

    const segments = path.split("/");
    const deniedSegment = segments.some((segment) => {
      const lowerSegment = segment.toLowerCase();
      return deniedPathSegments.has(lowerSegment) ||
        (/^\.env(?:\.|$)/i.test(segment) && lowerSegment !== ".env.example");
    });
    if (deniedSegment || isDeniedPath(path, mode as ClientPackageMode)) {
      findings.push({ code: "DENIED_PATH", path, message: "O caminho pertence a conteúdo interno ou não autorizado." });
    }

    if (!isAllowlistedDestination(path, entry.category)) {
      findings.push({ code: "UNALLOWLISTED_PATH", path, message: "O destino não pertence à allowlist desta categoria." });
    }

    if (!allowedCategories.has(entry.category)) {
      findings.push({ code: "CATEGORY_NOT_ALLOWED", path, message: "A categoria não é permitida neste modo de entrega." });
    }

    if (containsSecretMaterial(entry.content)) {
      findings.push({ code: "SECRET_DETECTED", path, message: "Foi detetado conteúdo com aspeto de credencial; o pacote foi bloqueado." });
    }

    if (entry.content === undefined) {
      findings.push({ code: "CONTENT_NOT_INSPECTED", path, message: "O conteúdo do ficheiro não foi disponibilizado para inspeção." });
    }

    const size = contentSize(entry);
    totalBytes += size;
    if (size > MAX_FILE_BYTES) {
      findings.push({ code: "FILE_TOO_LARGE", path, message: "O ficheiro excede o limite de 25 MiB." });
    }
    categories.add(entry.category);
  }

  if (totalBytes > MAX_PACKAGE_BYTES) {
    findings.push({ code: "PACKAGE_TOO_LARGE", message: "O pacote excede o limite de 200 MiB." });
  }

  for (const category of requiredCategories(mode === "LANDING_ONLY" || mode === "LANDING_WITH_CMS" ? mode : undefined)) {
    if (!categories.has(category)) {
      findings.push({ code: "MISSING_CATEGORY", message: `Falta a categoria obrigatória: ${category}.` });
    }
  }

  if (candidate?.isolatedBuildPassed !== true) {
    findings.push({ code: "BUILD_NOT_VERIFIED", message: "O pacote ainda não passou uma compilação isolada." });
  }

  if (mode === "LANDING_WITH_CMS" && candidate?.tenantIsolationPassed !== true) {
    findings.push({ code: "TENANT_ISOLATION_NOT_VERIFIED", message: "O isolamento server-side do tenant CMS não foi validado." });
  }

  return {
    format: "landingforge-client-package-audit",
    formatVersion: 1,
    policyVersion: 1,
    ready: findings.length === 0,
    fileCount: validEntries.length,
    totalBytes,
    findings,
  };
}
