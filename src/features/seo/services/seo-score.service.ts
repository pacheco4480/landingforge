export type SeoScoreInput = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImageUrl?: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  schemaJson?: unknown;
  missingAltTextCount: number;
};

export type SeoCheck = {
  label: string;
  passed: boolean;
  message: string;
};

export function getSeoChecks(input: SeoScoreInput): SeoCheck[] {
  return [
    {
      label: "Meta title",
      passed: isLengthBetween(input.metaTitle, 30, 60),
      message: "Use 30 to 60 characters.",
    },
    {
      label: "Meta description",
      passed: isLengthBetween(input.metaDescription, 120, 160),
      message: "Use 120 to 160 characters.",
    },
    {
      label: "Canonical URL",
      passed: Boolean(input.canonicalUrl),
      message: "Set a canonical URL or let LandingForge generate one.",
    },
    {
      label: "Open Graph image",
      passed: Boolean(input.ogImageUrl),
      message: "Select a social sharing image.",
    },
    {
      label: "Robots",
      passed: input.robotsIndex && input.robotsFollow,
      message: "Index/follow is recommended for published landing pages.",
    },
    {
      label: "Structured data",
      passed: Boolean(input.schemaJson),
      message: "Generate schema.org data for richer search results.",
    },
    {
      label: "Image alt text",
      passed: input.missingAltTextCount === 0,
      message: "Add alt text to images used by the page.",
    },
  ];
}

export function getSeoScore(input: SeoScoreInput) {
  const checks = getSeoChecks(input);
  const passed = checks.filter((check) => check.passed).length;
  return Math.round((passed / checks.length) * 100);
}

function isLengthBetween(
  value: string | null | undefined,
  min: number,
  max: number,
) {
  const length = value?.trim().length ?? 0;
  return length >= min && length <= max;
}
