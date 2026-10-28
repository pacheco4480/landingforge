import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { collectClientCmsSourceGraph } from "@/features/exports/services/client-cms-source-graph";
import { assembleClientCmsProject } from "@/features/exports/services/client-cms-project-assembler";
import { assembleAuditedClientCmsPackage } from "@/features/exports/services/client-cms-project-assembler";
import { buildProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";

const cmsProjectId = "950e8400-e29b-41d4-a716-446655440000";

function createCmsComposition() {
  const source = buildProjectSourceSnapshot({
    id: "cms-export-test",
    title: "Casa do Teste",
    slug: "casa-do-teste",
    template: { key: "restaurant" },
    templateVariant: { key: "playful" },
    theme: {
      name: "Teste", primaryColor: "#e35b46", secondaryColor: "#f7c85a", accentColor: "#126b56",
      backgroundColor: "#fff7ec", surfaceColor: "#ffffff", textPrimaryColor: "#24211d",
      textSecondaryColor: "#685f56", headingFont: "DM Sans", bodyFont: "Inter", borderRadius: "medium",
      shadowStyle: "soft", settings: {},
    },
    sections: [{ sectionKey: "hero", sectionType: "restaurant_hero", name: "Hero", sortOrder: 0, isVisible: true, content: { headline: "Uma mesa de teste" }, settings: {} }],
    forms: [],
    seoSetting: {
      metaTitle: "Casa do Teste | Reservas",
      metaDescription: "Reserva uma mesa na Casa do Teste.",
      keywords: "restaurante, Lisboa",
      ogTitle: null,
      ogDescription: null,
      twitterCardType: "summary_large_image",
      robotsIndex: true,
      robotsFollow: true,
    },
  } as never);
  return buildClientRuntimeComposition(source.snapshot, source.checksum, "LANDING_WITH_CMS", cmsProjectId, undefined, {
    siteManagementOwner: "LANDINGFORGE",
    hostingOwner: "CLIENT",
    domainOwner: "CLIENT",
    contentOwner: "CLIENT",
    publishingOwner: "LANDINGFORGE",
    maintenancePlan: "ON_DEMAND",
    maintenanceScope: "Alterações de conteúdo acordadas",
    maintenanceChannel: "Email de suporte acordado",
    maintenanceWindow: null,
  });
}

describe("Landing + CMS package source and bootstrap", () => {
  it("selects only the approved template graph and the dedicated CMS runtime", () => {
    const graph = collectClientCmsSourceGraph("restaurant", "playful");
    expect(graph.files).toContain("src/features/exports/client-runtime/cms/auth.ts");
    expect(graph.files).toContain("src/types/next-auth.d.ts");
    expect(graph.files.some((file) => /(?:features\/(?:clients|projects|crm)|prisma|briefings?|src\/app)/i.test(file))).toBe(false);
    expect(graph.dependencies).toEqual(expect.arrayContaining(["@supabase/supabase-js", "argon2", "next-auth", "pg"]));
    expect(graph.dependencies).not.toContain("@prisma/client");
  }, 15_000);

  it("materializes CMS routes, isolated migrations and blank environment values without Master sources", () => {
    const composition = createCmsComposition();
    const temporaryParent = mkdtempSync(join(tmpdir(), "landingforge-client-cms-test-"));
    const destination = join(temporaryParent, "client-cms");
    try {
      assembleClientCmsProject(composition, destination);
      const environment = readFileSync(join(destination, ".env.example"), "utf8");
      const bootstrap = JSON.parse(readFileSync(join(destination, "database/initial-snapshot.json"), "utf8")) as { projectId: string; sourceChecksum: string; snapshot: { page: { title: string } } };
      const deliverySummary = readFileSync(join(destination, "client-docs/RESUMO-DA-ENTREGA.md"), "utf8");
      const faq = readFileSync(join(destination, "client-docs/FAQ.md"), "utf8");
      const deliveryChecklist = readFileSync(join(destination, "client-docs/CHECKLIST-DE-ENTREGA.md"), "utf8");
      const cmsGuide = readFileSync(join(destination, "client-docs/GUIA-CMS.md"), "utf8");
      const handover = readFileSync(join(destination, "client-docs/HANDOVER.md"), "utf8");
      const packageJson = JSON.parse(readFileSync(join(destination, "package.json"), "utf8")) as {
        dependencies: Record<string, string>;
        scripts: Record<string, string>;
      };
      expect(existsSync(join(destination, "app/api/auth/[...nextauth]/route.ts"))).toBe(true);
      expect(existsSync(join(destination, "app/cms/(workspace)/content/page.tsx"))).toBe(true);
      expect(existsSync(join(destination, "public/assets/restaurant/boca-pop/sticker-plate.svg"))).toBe(true);
      expect(existsSync(join(destination, "public/assets/restaurant/boca-pop/sticker-glass.svg"))).toBe(true);
      expect(existsSync(join(destination, "public/assets/restaurant/boca-pop/confetti-pattern.svg"))).toBe(true);
      expect(existsSync(join(destination, "migrations/0001_client_cms_foundation.sql"))).toBe(true);
      expect(bootstrap).toMatchObject({ projectId: cmsProjectId, snapshot: { page: { title: "Casa do Teste" } } });
      expect(bootstrap.sourceChecksum).toMatch(/^[a-f0-9]{64}$/);
      expect(environment).toContain(`CLIENT_CMS_PROJECT_ID=${cmsProjectId}`);
      expect(environment).not.toMatch(/(?:AUTH_SECRET|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=\S+/);
      expect(environment).not.toContain("re_");
      expect(deliverySummary).toContain("Casa do Teste");
      expect(deliverySummary).toContain("Landing + CMS dedicado");
      expect(deliverySummary).toContain("Meta title:** Casa do Teste");
      expect(deliverySummary).toContain("#e35b46");
      expect(deliverySummary).toContain("DM Sans");
      expect(deliverySummary).toContain("- Hero");
      expect(faq).toContain("editor trabalha com JSON por secção");
      expect(faq).toContain("não envia notificações automáticas de lead por email");
      expect(deliveryChecklist).toContain("Confirmar base de dados dedicada");
      expect(cmsGuide).toContain("`headline`");
      expect(cmsGuide).toContain("5 000 caracteres");
      expect(cmsGuide).toContain("mas não editar os seus campos");
      expect(handover).toContain("CMS dedicado incluído");
      expect(handover).toContain("LandingForge");
      expect(handover).toContain("Alterações de conteúdo acordadas");
      expect(handover).toContain("preencher após configuração e verificação");
      expect(deliverySummary).not.toContain(cmsProjectId);
      expect(deliverySummary).not.toContain("DATABASE_URL");
      expect(packageJson.dependencies).toHaveProperty("next-auth");
      expect(packageJson.dependencies).toHaveProperty("argon2");
      expect(packageJson.dependencies).toHaveProperty("server-only", "0.0.1");
      expect(packageJson.scripts["cms:bootstrap"]).toContain("--conditions=react-server");
      expect(readFileSync(join(destination, "scripts/client-cms-bootstrap.ts"), "utf8")).toContain('dotenv.config({ path: ".env.local" })');
      expect(readFileSync(join(destination, "deployment/migrate-client-cms.mjs"), "utf8")).toContain('dotenv.config({ path: ".env.local" })');
      expect(packageJson.dependencies).not.toHaveProperty("@prisma/client");
      expect(existsSync(join(destination, "src/features/projects"))).toBe(false);
      expect(existsSync(join(destination, "prompts"))).toBe(false);
      expect(existsSync(join(destination, "tasks"))).toBe(false);
    } finally {
      rmSync(temporaryParent, { recursive: true, force: true });
    }
  }, 20_000);

  it.skipIf(process.env.RUN_CLIENT_CMS_PACKAGE_BUILD !== "1")("builds the independent CMS package but refuses archive until tenant isolation passes", async () => {
    const result = await assembleAuditedClientCmsPackage(createCmsComposition(), false);
    const codes = result.audit.findings.map(({ code }) => code);
    expect(codes).not.toContain("BUILD_NOT_VERIFIED");
    expect(codes).toContain("TENANT_ISOLATION_NOT_VERIFIED");
    expect(result.archive.byteLength).toBe(0);
    expect(result.checksum).toBe("");
  }, 540_000);

  it.skipIf(process.env.RUN_CLIENT_CMS_PACKAGE_ARCHIVE_TEST !== "1")("returns only an audited CMS archive after both gates pass", async () => {
    const result = await assembleAuditedClientCmsPackage(createCmsComposition(), true);
    expect(result.audit.ready).toBe(true);
    expect(result.archive.byteLength).toBeGreaterThan(0);
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    const files = unzipSync(result.archive);
    const paths = Object.keys(files);
    expect(paths).toContain("app/cms/login/page.tsx");
    expect(paths).toContain("app/api/auth/[...nextauth]/route.ts");
    expect(paths).toContain("migrations/0001_client_cms_foundation.sql");
    expect(paths).toContain("public/assets/restaurant/boca-pop/sticker-plate.svg");
    expect(paths).toContain("public/assets/restaurant/boca-pop/sticker-glass.svg");
    expect(paths).toContain("public/assets/restaurant/boca-pop/confetti-pattern.svg");
    expect(paths.some((path) => /(?:^|\/)(?:prompts|tasks|portfolio|docs|\.git|node_modules)(?:\/|$)/i.test(path))).toBe(false);
    expect(paths).not.toContain(".env");
    expect(paths).toContain(".env.example");
  }, 540_000);
});
