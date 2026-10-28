import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { buildClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { listClientRuntimeTemplateProfiles } from "@/features/exports/services/client-runtime-catalog";
import { collectClientRuntimeSourceGraph } from "@/features/exports/services/client-runtime-source-graph";
import { assembleClientRuntimeSourceFiles } from "@/features/exports/services/client-runtime-source-assembler";
import { assembleClientRuntimeProject, listClientRuntimeMaintenanceSources } from "@/features/exports/services/client-runtime-project-assembler";
import { buildProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";

type SnapshotInput = Parameters<typeof buildProjectSourceSnapshot>[0];

function createPage(id: string, headline: string): SnapshotInput {
  return {
    id,
    title: `Landing ${id}`,
    slug: `landing-${id}`,
    template: { key: "restaurant" },
    templateVariant: { key: "playful" },
    theme: {
      name: "Theme",
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
    sections: [{
      sectionKey: "hero",
      sectionType: "restaurant_hero",
      name: "Hero",
      sortOrder: 0,
      isVisible: true,
      content: { headline },
      settings: {},
    }],
    forms: [{
      name: "Reserva",
      key: "reservation",
      type: "BOOKING",
      successMessage: "Pedido recebido.",
      errorMessage: "Tente novamente.",
      gdprConsentRequired: true,
      gdprConsentLabel: "Li e aceito a Política de Privacidade.",
      gdprConsentVersion: "1.2",
      fields: [],
    }],
    seoSetting: {
      metaTitle: "Restaurante de teste | Reserva",
      metaDescription: "Descobre a experiência e reserva a tua mesa.",
      keywords: "restaurante, reserva",
      ogTitle: null,
      ogDescription: null,
      twitterCardType: "summary_large_image",
      robotsIndex: true,
      robotsFollow: true,
    },
  } as unknown as SnapshotInput;
}

describe("client runtime composition", () => {
  it("keeps project payloads deeply isolated and retains consent configuration", () => {
    const first = buildProjectSourceSnapshot(createPage("one", "Landing um"));
    const second = buildProjectSourceSnapshot(createPage("two", "Landing dois"));
    const firstComposition = buildClientRuntimeComposition(first.snapshot, first.checksum);
    const secondComposition = buildClientRuntimeComposition(second.snapshot, second.checksum);

    firstComposition.payload.page.sections[0].content = { headline: "Alterado" };
    expect(secondComposition.payload.page.sections[0].content).toEqual({ headline: "Landing dois" });
    expect(first.snapshot.page.sections[0].content).toEqual({ headline: "Landing um" });
    expect(firstComposition.payload.page.forms[0]).toMatchObject({
      gdprConsentRequired: true,
      gdprConsentLabel: "Li e aceito a Política de Privacidade.",
      gdprConsentVersion: "1.2",
    });
    expect(firstComposition.template.sourceFiles).toContain(firstComposition.template.entrypoint);
  }, 20_000);

  it("accepts empty content and preserves larger repeatable public section data", () => {
    const emptyPage = createPage("empty", "Landing vazia");
    emptyPage.sections = [];
    emptyPage.forms = [];
    const emptySnapshot = buildProjectSourceSnapshot(emptyPage);
    const emptyComposition = buildClientRuntimeComposition(emptySnapshot.snapshot, emptySnapshot.checksum);
    expect(emptyComposition.payload.page.sections).toEqual([]);
    expect(emptyComposition.payload.page.forms).toEqual([]);

    const populatedPage = createPage("many", "Landing com secções repetíveis");
    populatedPage.sections = Array.from({ length: 30 }, (_, index) => ({
      sectionKey: `hero-${index}`,
      sectionType: "restaurant_hero",
      name: `Hero ${index}`,
      sortOrder: 29 - index,
      isVisible: true,
      content: { headline: `Título ${index}`, highlights: Array.from({ length: 5 }, (_, item) => `Destaque ${item}`) },
      settings: {},
    }));
    const populatedSnapshot = buildProjectSourceSnapshot(populatedPage);
    const populatedComposition = buildClientRuntimeComposition(populatedSnapshot.snapshot, populatedSnapshot.checksum);
    expect(populatedComposition.payload.page.sections).toHaveLength(30);
    expect(populatedComposition.payload.page.sections[0].sortOrder).toBe(0);
    expect(populatedComposition.payload.page.sections[0].content).toMatchObject({ highlights: expect.any(Array) });
  }, 20_000);

  it("resolves each approved variant only through its allowlisted source graph", () => {
    for (const profile of listClientRuntimeTemplateProfiles()) {
      const files = collectClientRuntimeSourceGraph(profile.templateKey, profile.variantKey);
      expect(files.files).toContain(profile.entrypoint);
      expect(files.files.every((file) => !/(?:\/|^)(?:clients|projects|crm|protected|auth)(?:\/|$)/i.test(file))).toBe(true);
      expect(files.dependencies).not.toContain("next-auth");
      expect(files.dependencies).not.toContain("@prisma/client");
    }
  }, 60_000);

  it("rejects unapproved variants before constructing a source graph", () => {
    expect(() => collectClientRuntimeSourceGraph("restaurant", "unknown")).toThrow("não tem um runtime cliente aprovado");
  });

  it("materializes only allowlisted sources in a new temporary destination", () => {
    const temporaryParent = mkdtempSync(join(tmpdir(), "landingforge-runtime-test-"));
    const destination = join(temporaryParent, "runtime");
    try {
      const manifest = assembleClientRuntimeSourceFiles("restaurant", "playful", destination);
      const serializedManifest = readFileSync(join(destination, "client-runtime-source-manifest.json"), "utf8");

      expect(manifest.files).toContain("src/features/exports/client-runtime/renderer.tsx");
      expect(manifest.files.every((file) => file.startsWith("src/"))).toBe(true);
      expect(manifest.files.some((file) => /(?:^|\/)(?:projects|clients|crm|protected|auth)(?:\/|$)/i.test(file))).toBe(false);
      expect(serializedManifest).toContain("landingforge-client-runtime-source-plan");
      expect(existsSync(join(destination, "src/features/exports/client-runtime/entrypoints/restaurant/playful.tsx"))).toBe(true);
    } finally {
      rmSync(temporaryParent, { recursive: true, force: true });
    }
  });

  it("refuses destinations in the repository and refuses to overwrite an existing directory", () => {
    expect(() => assembleClientRuntimeSourceFiles("restaurant", "playful", resolve(".landingforge", "unsafe")))
      .toThrow("diretório temporário dedicado");

    const temporaryParent = mkdtempSync(join(tmpdir(), "landingforge-runtime-test-"));
    const destination = join(temporaryParent, "existing");
    mkdirSync(destination);
    try {
      expect(() => assembleClientRuntimeSourceFiles("restaurant", "playful", destination))
        .toThrow("já existe");
    } finally {
      rmSync(temporaryParent, { recursive: true, force: true });
    }
  });

  it("generates an isolated Next application with only public payload and client-owned environment placeholders", () => {
    const snapshot = buildProjectSourceSnapshot(createPage("app", "Landing independente"));
    const composition = buildClientRuntimeComposition(snapshot.snapshot, snapshot.checksum);
    const temporaryParent = mkdtempSync(join(tmpdir(), "landingforge-client-app-test-"));
    const destination = join(temporaryParent, "client-app");
    try {
      const generated = assembleClientRuntimeProject(composition, destination);
      const page = readFileSync(join(destination, "app/page.tsx"), "utf8");
      const environment = readFileSync(join(destination, ".env.example"), "utf8");
      const deliverySummary = readFileSync(join(destination, "client-docs/RESUMO-DA-ENTREGA.md"), "utf8");
      const faq = readFileSync(join(destination, "client-docs/FAQ.md"), "utf8");
      const deliveryChecklist = readFileSync(join(destination, "client-docs/CHECKLIST-DE-ENTREGA.md"), "utf8");
      const manifest = JSON.parse(readFileSync(join(destination, "deployment/client-runtime-project-manifest.json"), "utf8"));
      const packageJson = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
      const lockfile = JSON.parse(readFileSync(resolve("package-lock.json"), "utf8"));

      expect(generated.files).toContain("app/page.tsx");
      expect(page).toContain("generateMetadata");
      expect(page).toContain("restaurant/playful");
      expect(environment).toContain("RESEND_API_KEY=");
      expect(environment).not.toContain("re_");
      expect(readFileSync(join(destination, "app/actions.ts"), "utf8")).toContain("Boolean(turnstileSiteKey) !== Boolean(turnstileSecret)");
      expect(manifest).toMatchObject({ mode: "LANDING_ONLY", credentialsCopied: false, buildVerified: false });
      expect(packageJson.dependencies).not.toHaveProperty("@prisma/client");
      expect(packageJson.dependencies).not.toHaveProperty("next-auth");
      expect(packageJson.dependencies.next).toBe(lockfile.packages["node_modules/next"].version);
      expect(existsSync(join(destination, "src/client-runtime/features/exports/client-runtime/renderer.tsx"))).toBe(true);
      expect(readFileSync(join(destination, "app/page.tsx"), "utf8")).toContain("@/client-runtime/features/exports/client-runtime/renderer");
      expect(existsSync(join(destination, "src/client-runtime-payload.json"))).toBe(true);
      expect(existsSync(join(destination, "client-docs/ANTES-DE-PUBLICAR.md"))).toBe(true);
      expect(deliverySummary).toContain("Landing app");
      expect(deliverySummary).toContain("- Hero");
      expect(deliverySummary).toContain("Reserva");
      expect(deliverySummary).toContain("não inclui CMS");
      expect(deliverySummary).toContain("Meta title:** Restaurante de teste");
      expect(deliverySummary).toContain("#e35b46");
      expect(deliverySummary).toContain("DM Sans");
      expect(faq).toContain("Só as chaves declaradas no guia CMS podem ser alteradas.");
      expect(deliveryChecklist).toContain("Confirmar modo, template/variante, versão e SHA-256 do snapshot.");
      expect(existsSync(join(destination, "client-docs/GUIA-CMS.md"))).toBe(false);
      expect(readFileSync(join(destination, "client-docs/HANDOVER.md"), "utf8")).toContain("Não existe CMS nem acesso de edição");
      expect(deliverySummary).not.toContain("DATABASE_URL");
      expect(deliverySummary).not.toContain("RESEND_API_KEY");
      expect(existsSync(join(destination, "src/features/projects"))).toBe(false);
    } finally {
      rmSync(temporaryParent, { recursive: true, force: true });
    }
  }, 20_000);

  it("applies only allowlisted template-source overrides to the isolated package", () => {
    const snapshot = buildProjectSourceSnapshot(createPage("code-change", "Landing com alteração estrutural"));
    const composition = buildClientRuntimeComposition(snapshot.snapshot, snapshot.checksum);
    const source = listClientRuntimeMaintenanceSources("restaurant", "playful").find((file) => file.sourcePath.endsWith("restaurant-playful.tsx"));
    expect(source).toBeDefined();
    const replacement = `${source!.content}\n// Alteração estrutural isolada de teste.`;
    const temporaryParent = mkdtempSync(join(tmpdir(), "landingforge-code-patch-test-"));
    const destination = join(temporaryParent, "client-app");
    try {
      assembleClientRuntimeProject(composition, destination, { [source!.packagePath]: replacement });
      expect(readFileSync(join(destination, source!.packagePath), "utf8")).toContain("Alteração estrutural isolada de teste");
    } finally {
      rmSync(temporaryParent, { recursive: true, force: true });
    }

    const rejectedParent = mkdtempSync(join(tmpdir(), "landingforge-code-patch-reject-test-"));
    try {
      expect(() => assembleClientRuntimeProject(composition, join(rejectedParent, "client-app"), {
        "src/client-runtime/app/page.tsx": "export default function Page() { return null; }",
      })).toThrow("fora da allowlist");
    } finally {
      rmSync(rejectedParent, { recursive: true, force: true });
    }
  }, 20_000);

  it.skipIf(process.env.CLIENT_RUNTIME_BUILD_SMOKE !== "1")(
    "builds the generated standalone landing with the workspace-installed toolchain",
    () => {
      const snapshot = buildProjectSourceSnapshot(createPage("build", "Landing pronta para build"));
      const composition = buildClientRuntimeComposition(snapshot.snapshot, snapshot.checksum);
      const source = listClientRuntimeMaintenanceSources("restaurant", "playful").find((file) => file.sourcePath.endsWith("restaurant-playful.tsx"));
      if (!source) throw new Error("O ficheiro de template esperado para o teste estrutural não foi encontrado.");
      const temporaryParent = mkdtempSync(join(tmpdir(), "landingforge-client-build-test-"));
      const destination = join(temporaryParent, "client-app");
      try {
        assembleClientRuntimeProject(composition, destination, {
          [source.packagePath]: `${source.content}\n// alteração estrutural verificada pelo build smoke`,
        });
        if (!process.env.npm_execpath) throw new Error("O smoke test requer execução através do npm.");
        const installArgs = [process.env.npm_execpath, "install", "--ignore-scripts", "--no-audit", "--no-fund"];
        if (process.env.CLIENT_RUNTIME_ALLOW_NETWORK !== "1") installArgs.splice(2, 0, "--offline");
        execFileSync(process.execPath, installArgs, {
          cwd: destination,
          env: { ...process.env, npm_config_offline: process.env.CLIENT_RUNTIME_ALLOW_NETWORK === "1" ? "false" : "true" },
          stdio: "pipe",
          timeout: 180_000,
        });
        try {
          execFileSync(process.execPath, [resolve(destination, "node_modules/next/dist/bin/next"), "build", "--webpack"], {
            cwd: destination,
            env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
            stdio: "pipe",
            timeout: 180_000,
          });
        } catch (error) {
          const childError = error as { stderr?: Buffer; stdout?: Buffer };
          const diagnostic = `${childError.stdout?.toString() ?? ""}\n${childError.stderr?.toString() ?? ""}`;
          throw new Error(`O build isolado falhou${process.env.CLIENT_RUNTIME_KEEP_BUILD_SMOKE === "1" ? `; aplicação mantida em ${destination}` : ""}: ${diagnostic.slice(-6000)}`);
        }
        expect(existsSync(join(destination, ".next/BUILD_ID"))).toBe(true);
      } finally {
        if (process.env.CLIENT_RUNTIME_KEEP_BUILD_SMOKE !== "1") {
          rmSync(temporaryParent, { recursive: true, force: true });
        }
      }
    },
    370_000,
  );
});
