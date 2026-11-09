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
      label: "Título SEO",
      passed: isLengthBetween(input.metaTitle, 30, 60),
      message: "Usa entre 30 e 60 caracteres.",
    },
    {
      label: "Descrição SEO",
      passed: isLengthBetween(input.metaDescription, 120, 160),
      message: "Usa entre 120 e 160 caracteres.",
    },
    {
      label: "URL canónico",
      passed: Boolean(input.canonicalUrl),
      message: "Define um URL canónico ou deixa o LandingForge gerar um.",
    },
    {
      label: "Imagem para partilha",
      passed: Boolean(input.ogImageUrl),
      message: "Seleciona uma imagem para partilha nas redes sociais.",
    },
    {
      label: "Indexação e seguimento",
      passed: input.robotsIndex && input.robotsFollow,
      message: "Recomenda-se indexar e seguir ligações nas landing pages publicadas.",
    },
    {
      label: "Dados estruturados",
      passed: Boolean(input.schemaJson),
      message: "Gera dados estruturados para enriquecer os resultados de pesquisa.",
    },
    {
      label: "Texto alternativo das imagens",
      passed: input.missingAltTextCount === 0,
      message: "Adiciona texto alternativo às imagens utilizadas na página.",
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
