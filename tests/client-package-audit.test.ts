import { describe, expect, it } from "vitest";

import { auditClientPackage, type ClientPackageEntry } from "@/features/exports/services/client-package-audit";

const landingOnlyFiles: ClientPackageEntry[] = [
  { path: "app/page.tsx", category: "frontend", content: "export default function Page() {}" },
  { path: "src/client-runtime-payload.json", category: "frontend", content: "{}" },
  { path: "public/brand.webp", category: "assets", content: new Uint8Array([1, 2, 3]) },
  { path: "seo/metadata.json", category: "seo", content: "{}" },
  { path: "forms/contact.json", category: "forms", content: "{}" },
  { path: "deployment/README.md", category: "deployment", content: "Deploy" },
  { path: ".env.example", category: "deployment", content: "DATABASE_URL=\nAUTH_SECRET=\n" },
  { path: "client-docs/README.md", category: "client-documentation", content: "Guide" },
];

describe("client package security audit", () => {
  it("allows a clean Landing Only package only after an isolated build", () => {
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: landingOnlyFiles,
      isolatedBuildPassed: true,
    });

    expect(report.ready).toBe(true);
    expect(report.findings).toEqual([]);
    expect(report).toMatchObject({
      format: "landingforge-client-package-audit",
      formatVersion: 1,
      policyVersion: 1,
    });
  });

  it("fails closed for unknown modes, categories and malformed manifests without throwing", () => {
    const invalidMode = auditClientPackage({
      mode: "SOMETHING_ELSE",
      entries: landingOnlyFiles,
      isolatedBuildPassed: true,
    });
    expect(invalidMode.ready).toBe(false);
    expect(invalidMode.findings.some(({ code }) => code === "INVALID_MODE")).toBe(true);

    const invalidCategory = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [{ path: "app/page.tsx", category: "master" as never, content: "" }],
      isolatedBuildPassed: true,
    });
    expect(invalidCategory.ready).toBe(false);
    expect(invalidCategory.findings.some(({ code }) => code === "INVALID_CATEGORY")).toBe(true);

    expect(auditClientPackage(null).findings.map(({ code }) => code)).toContain("INVALID_MANIFEST");
  });

  it("blocks path traversal, symlinks and internal project material", () => {
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [
        ...landingOnlyFiles,
        { path: "../../.env", category: "deployment" },
        { path: "tasks/TASKS_MASTER_PLAN.md", category: "client-documentation", symbolicLink: true },
      ],
      isolatedBuildPassed: true,
    });

    expect(report.ready).toBe(false);
    expect(report.findings.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["INVALID_PATH", "DENIED_PATH", "SYMBOLIC_LINK"]),
    );
  });

  it("does not trust a caller-assigned category for files outside the destination allowlist", () => {
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [...landingOnlyFiles, { path: "src/features/admin/users.ts", category: "frontend" }],
      isolatedBuildPassed: true,
    });

    expect(report.ready).toBe(false);
    expect(report.findings.some(({ code }) => code === "UNALLOWLISTED_PATH")).toBe(true);
  });

  it("blocks internal application routes and every API route from the frontend destination", () => {
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [
        ...landingOnlyFiles,
        { path: "app/api/leads/route.ts", category: "frontend", content: "export async function POST() {}" },
        { path: "app/dashboard/page.tsx", category: "frontend", content: "export default function Page() {}" },
      ],
      isolatedBuildPassed: true,
    });

    expect(report.ready).toBe(false);
    expect(report.findings.filter(({ code }) => code === "DENIED_PATH")).toHaveLength(2);
    expect(report.findings.filter(({ code }) => code === "UNALLOWLISTED_PATH")).toHaveLength(2);
  });

  it("blocks recognizable credentials without echoing their values", () => {
const secret = "RESEND_API_KEY=re_000000000000000000000000000000000000";
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [...landingOnlyFiles, { path: "deployment/config.txt", category: "deployment", content: secret }],
      isolatedBuildPassed: true,
    });

    expect(report.ready).toBe(false);
    expect(report.findings.find(({ code }) => code === "SECRET_DETECTED")).toEqual({
      code: "SECRET_DETECTED",
      path: "deployment/config.txt",
      message: "Foi detetado conteúdo com aspeto de credencial; o pacote foi bloqueado.",
    });
  });

  it("scans valid UTF-8 binary entries and rejects files it cannot inspect", () => {
const secretBytes = new TextEncoder().encode("sb_secret_000000000000000000000000000000000000");
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [
        ...landingOnlyFiles,
        { path: "public/hidden.txt", category: "assets", content: secretBytes },
        { path: "public/unreadable.bin", category: "assets", sizeBytes: 12 },
      ],
      isolatedBuildPassed: true,
    });

    expect(report.findings.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["SECRET_DETECTED", "CONTENT_NOT_INSPECTED"]),
    );
  });

  it("allows the documented .env.example but blocks other environment files", () => {
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [
        ...landingOnlyFiles,
        { path: ".env.example", category: "deployment", content: "DATABASE_URL=\n" },
        { path: ".env.local", category: "deployment", content: "" },
      ],
      isolatedBuildPassed: true,
    });

    expect(report.findings.some(({ code, path }) => code === "DENIED_PATH" && path === ".env.local")).toBe(true);
    expect(report.findings.some(({ code, path }) => code === "DENIED_PATH" && path === ".env.example")).toBe(false);
  });

  it("detects duplicate archive paths without trusting declared sizes", () => {
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [
        ...landingOnlyFiles,
        { path: "app/page.tsx", category: "frontend", content: "x", sizeBytes: 500_000_000 },
      ],
      isolatedBuildPassed: true,
    });

    expect(report.findings.some(({ code }) => code === "DUPLICATE_PATH")).toBe(true);
    expect(report.totalBytes).toBeLessThan(500_000_000);
  });

  it("requires CMS, auth, schema, migrations, isolated build and tenant isolation for CMS delivery", () => {
    const entries: ClientPackageEntry[] = [
      ...landingOnlyFiles,
      { path: "cms/editor.tsx", category: "cms" },
      { path: "auth/config.ts", category: "auth" },
      { path: "prisma/schema.prisma", category: "database" },
      { path: "prisma/migrations/001/init.sql", category: "migrations" },
    ];
    const report = auditClientPackage({
      mode: "LANDING_WITH_CMS",
      entries,
      isolatedBuildPassed: false,
      tenantIsolationPassed: false,
    });

    expect(report.ready).toBe(false);
    expect(report.findings.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["BUILD_NOT_VERIFIED", "TENANT_ISOLATION_NOT_VERIFIED"]),
    );
  });

  it("rejects CMS-only categories in Landing Only mode", () => {
    const report = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [...landingOnlyFiles, { path: "cms/admin.tsx", category: "cms" }],
      isolatedBuildPassed: true,
    });

    expect(report.ready).toBe(false);
    expect(report.findings.some(({ code }) => code === "CATEGORY_NOT_ALLOWED")).toBe(true);
  });

  it("allows only the NextAuth handler API in CMS delivery", () => {
    const cmsFiles = [
      ...landingOnlyFiles,
      { path: "cms/editor.tsx", category: "cms" as const, content: "export {};" },
      { path: "auth/config.ts", category: "auth" as const, content: "export {};" },
      { path: "database/snapshot.json", category: "database" as const, content: "{}" },
      { path: "migrations/0001.sql", category: "migrations" as const, content: "SELECT 1;" },
      { path: "app/cms/page.tsx", category: "frontend" as const, content: "export default function Page() {}" },
      { path: "app/api/auth/[...nextauth]/route.ts", category: "frontend" as const, content: "export {};" },
    ];
    const report = auditClientPackage({
      mode: "LANDING_WITH_CMS",
      entries: cmsFiles,
      isolatedBuildPassed: true,
      tenantIsolationPassed: true,
    });
    expect(report.findings).toEqual([]);

    const unsafe = auditClientPackage({
      mode: "LANDING_WITH_CMS",
      entries: [
        ...cmsFiles,
        { path: "app/api/projects/route.ts", category: "frontend", content: "export {};" },
      ],
      isolatedBuildPassed: true,
      tenantIsolationPassed: true,
    });
    expect(unsafe.findings.map(({ code }) => code)).toEqual(expect.arrayContaining(["DENIED_PATH", "UNALLOWLISTED_PATH"]));

    const landingOnly = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [...landingOnlyFiles, { path: "app/api/auth/[...nextauth]/route.ts", category: "frontend", content: "export {};" }],
      isolatedBuildPassed: true,
    });
    expect(landingOnly.findings.some(({ code, path }) => code === "DENIED_PATH" && path === "app/api/auth/[...nextauth]/route.ts")).toBe(true);
  });
});
