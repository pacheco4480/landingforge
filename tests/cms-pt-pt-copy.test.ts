import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "src/app/(protected)/branding/page.tsx",
  "src/app/(protected)/seo/page.tsx",
  "src/features/branding/components/branding-form.tsx",
  "src/features/branding/components/logo-manager.tsx",
  "src/features/content/components/pages-table.tsx",
  "src/features/legal/components/legal-overview.tsx",
  "src/features/legal/components/legal-settings-form.tsx",
  "src/features/seo/components/redirects-manager.tsx",
  "src/features/seo/components/seo-page-selector.tsx",
  "src/features/seo/components/seo-settings-form.tsx",
  "src/features/settings/components/notification-overview.tsx",
  "src/features/settings/components/notification-settings-form.tsx",
  "src/features/settings/components/security-settings-form.tsx",
];

const source = files.map((path) => readFileSync(path, "utf8")).join("\n");

describe("CMS Portuguese (Portugal) copy", () => {
  it("uses current PT-PT spelling on the revised surfaces", () => {
    for (const phrase of [
      "Configuração de cookies",
      "Exportação de dados pessoais",
      "Redirecionamentos",
      "Sem imagem selecionada",
      "Desativado",
      "ativo",
      "Termos e Condições",
      "O URL canónico é um metadado de SEO",
    ]) {
      expect(source).toContain(phrase);
    }

    for (const outdated of [
      "Configuracao de cookies",
      "Exportacao de dados pessoais",
      "Redireccionamentos",
      "Sem imagem seleccionada",
      "Desactivado",
      "Termos e Condicoes",
      "Canonical é metadata SEO",
    ]) {
      expect(source).not.toContain(outdated);
    }
  });
});
