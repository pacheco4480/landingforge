const localFallbackUrl = "http://localhost:3000";

export function normalizeSiteBaseUrl(
  domain: string | null | undefined,
  fallback = process.env.NEXT_PUBLIC_SITE_URL,
) {
  const raw = (domain || fallback || localFallbackUrl).trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  return url.origin;
}

export function normalizePath(path: string) {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  const [pathname = ""] = trimmed.split(/[?#]/);
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}

export function buildCanonicalUrl(
  domain: string | null | undefined,
  slug: string,
) {
  const base = normalizeSiteBaseUrl(domain);
  if (slug === "home") return base;
  return `${base}${normalizePath(slug)}`;
}

export function resolveCanonicalUrl({
  canonicalUrl,
  domain,
  slug,
}: {
  canonicalUrl?: string | null;
  domain?: string | null;
  slug: string;
}) {
  if (!canonicalUrl) return buildCanonicalUrl(domain, slug);
  const trimmed = canonicalUrl.trim();
  if (!trimmed) return buildCanonicalUrl(domain, slug);
  if (trimmed.startsWith("/")) {
    return `${normalizeSiteBaseUrl(domain)}${normalizePath(trimmed)}`;
  }
  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Canonical URL must use http or https.");
  }
  url.hash = "";
  const normalized = url.toString();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function isInternalPath(value: string) {
  return (
    value.startsWith("/") && !value.startsWith("//") && !value.includes("://")
  );
}
