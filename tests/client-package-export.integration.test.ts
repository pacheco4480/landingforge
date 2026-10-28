import { describe, expect, it } from "vitest";
import { unzipSync } from "fflate";

import { buildClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { assembleAuditedLandingOnlyPackage } from "@/features/exports/services/client-package-assembler";
import { buildProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";

describe("Landing Only package independent build", () => {
  it.skipIf(process.env.RUN_CLIENT_PACKAGE_BUILD !== "1")(
    "builds and audits a real Restaurant Playful package",
    async () => {
      const snapshot = buildProjectSourceSnapshot({
        id: "integration-export",
        title: "Mesa de Teste",
        slug: "mesa-de-teste",
        template: { key: "restaurant" },
        templateVariant: { key: "playful" },
        theme: {
          name: "Teste",
          primaryColor: "#e35b46",
          secondaryColor: "#f7c85a",
          accentColor: "#126b56",
          backgroundColor: "#fff7ec",
          surfaceColor: "#ffffff",
          textPrimaryColor: "#24211d",
          textSecondaryColor: "#685f56",
          headingFont: "DM Sans",
          bodyFont: "Inter",
          borderRadius: "medium",
          shadowStyle: "soft",
          settings: {},
        },
        sections: [
          {
            sectionKey: "hero",
            sectionType: "restaurant_hero",
            name: "Hero",
            sortOrder: 0,
            isVisible: true,
            content: {
              headline: "Uma mesa para celebrar",
              heroImageUrl: "/screenshots/template-restaurant-playful.png",
            },
            settings: {},
          },
        ],
        forms: [],
        seoSetting: null,
      } as never);
      const composition = buildClientRuntimeComposition(
        snapshot.snapshot,
        snapshot.checksum,
      );
      const result = await assembleAuditedLandingOnlyPackage(composition);
      const files = unzipSync(result.archive);
      const manifest = JSON.parse(
        new TextDecoder().decode(
          files["deployment/client-runtime-project-manifest.json"],
        ),
      ) as { buildVerified: boolean };

      expect(result.audit.ready).toBe(true);
      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(manifest.buildVerified).toBe(true);
      expect(
        Object.keys(files).some((path) => path.startsWith("app/(protected)/")),
      ).toBe(false);
      expect(
        Object.keys(files).some(
          (path) =>
            path === ".env" ||
            path.startsWith("node_modules/") ||
            path.startsWith(".next/"),
        ),
      ).toBe(false);
      expect(files[".env.example"]).toBeDefined();
      expect(files["client-docs/ANTES-DE-PUBLICAR.md"]).toBeDefined();
      const formAction = new TextDecoder().decode(files["app/actions.ts"]);
      expect(formAction).toContain('formData.get("companyWebsite")');
      expect(formAction).toContain('formData.get("gdprConsent") !== "yes"');
      expect(formAction).toContain('formData.get("gdprConsentVersion")');
      expect(formAction).toContain("process.env.RESEND_API_KEY");
      expect(formAction).toContain("https://api.resend.com/emails");
      const packagedAssets = Object.keys(files).filter(
        (path) => path.startsWith("public/assets/") && !path.endsWith("/"),
      );
      expect(packagedAssets).toEqual(
        expect.arrayContaining([
          "public/assets/restaurant/boca-pop/confetti-pattern.svg",
          "public/assets/restaurant/boca-pop/sticker-glass.svg",
          "public/assets/restaurant/boca-pop/sticker-plate.svg",
          "public/assets/restaurant/boca-pop/sticker-sharing.svg",
        ]),
      );
      expect(
        files["public/screenshots/template-restaurant-playful.png"],
      ).toBeUndefined();
      const payload = JSON.parse(
        new TextDecoder().decode(files["src/client-runtime-payload.json"]),
      ) as { page: { sections: Array<{ content: Record<string, unknown> }> } };
      const heroImage = payload.page.sections[0]?.content.heroImageUrl as
        | string
        | undefined;
      expect(heroImage).toMatch(/^\/assets\/[a-f0-9]{64}\.png$/);
      if (heroImage) expect(files[`public${heroImage}`]).toBeDefined();
    },
    540_000,
  );
});
