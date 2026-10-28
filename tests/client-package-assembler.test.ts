import { describe, expect, it } from "vitest";
import { unzipSync } from "fflate";

import {
  collectTemplateStaticAssetPaths,
  createAuditedClientPackageArchive,
  isPublicNetworkAddress,
} from "@/features/exports/services/client-package-assembler";
import {
  auditClientPackage,
  type ClientPackageEntry,
} from "@/features/exports/services/client-package-audit";

const validEntries: ClientPackageEntry[] = [
  {
    path: "app/page.tsx",
    category: "frontend",
    content: "export default function Page() { return null; }",
  },
  { path: "app/actions.ts", category: "frontend", content: '"use server";' },
  {
    path: "app/politica-privacidade/page.tsx",
    category: "frontend",
    content: "export default function Page() { return null; }",
  },
  {
    path: "src/client-runtime/renderer.tsx",
    category: "frontend",
    content: "export {};",
  },
  {
    path: ".env.example",
    category: "deployment",
    content: "RESEND_API_KEY=\n",
  },
  { path: "package.json", category: "deployment", content: "{}" },
  {
    path: "client-docs/DEPLOYMENT.md",
    category: "client-documentation",
    content: "Configuração manual.",
  },
  {
    path: "public/assets/brand.jpg",
    category: "assets",
    content: new Uint8Array([1, 2, 3]),
  },
];

describe("client package archive", () => {
  it("allows public runtime routes and builds an inspectable archive only after the audit passes", () => {
    const audit = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: validEntries,
      isolatedBuildPassed: true,
    });
    expect(audit.ready).toBe(true);

    const archive = createAuditedClientPackageArchive(validEntries, true);
    const files = unzipSync(archive);
    expect(
      Object.keys(files)
        .filter((path) => !path.endsWith("/"))
        .sort(),
    ).toEqual(validEntries.map(({ path }) => path).sort());
    expect(
      new TextDecoder().decode(files["client-docs/DEPLOYMENT.md"]),
    ).toContain("Configuração manual");
    expect(files["public/assets/brand.jpg"]).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("refuses to archive failed builds or manifests that contain private routes", () => {
    const failedBuild = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: validEntries,
      isolatedBuildPassed: false,
    });
    expect(failedBuild.ready).toBe(false);
    expect(() =>
      createAuditedClientPackageArchive(validEntries, false),
    ).toThrow("não auditado");

    const privateManifest = auditClientPackage({
      mode: "LANDING_ONLY",
      entries: [
        ...validEntries,
        {
          path: "app/(protected)/dashboard/page.tsx",
          category: "frontend",
          content: "private",
        },
      ],
      isolatedBuildPassed: true,
    });
    expect(privateManifest.ready).toBe(false);
    expect(() =>
      createAuditedClientPackageArchive(
        [
          ...validEntries,
          {
            path: "app/(protected)/dashboard/page.tsx",
            category: "frontend",
            content: "private",
          },
        ],
        true,
      ),
    ).toThrow("não auditado");
  });

  it("rejects file and directory path collisions before writing the ZIP", () => {
    const entries: ClientPackageEntry[] = [
      ...validEntries,
      { path: "public/assets", category: "assets", content: "not-a-directory" },
      {
        path: "public/assets/new.jpg",
        category: "assets",
        content: new Uint8Array([4]),
      },
    ];
    const audit = auditClientPackage({
      mode: "LANDING_ONLY",
      entries,
      isolatedBuildPassed: true,
    });
    expect(audit.ready).toBe(true);
    expect(() => createAuditedClientPackageArchive(entries, true)).toThrow(
      "caminho duplicado no archive",
    );
  });
});

describe("public asset host validation", () => {
  it.each([
    "10.0.0.2",
    "127.0.0.1",
    "169.254.169.254",
    "172.20.0.1",
    "192.168.1.1",
    "::1",
    "fe80::1",
    "fd00::1",
  ])("rejects non-public address %s", (address) =>
    expect(isPublicNetworkAddress(address)).toBe(false),
  );

  it.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])(
    "accepts public address %s",
    (address) => expect(isPublicNetworkAddress(address)).toBe(true),
  );
});

describe("template static asset collection", () => {
  it("collects only safe static assets referenced by the selected template sources", () => {
    const paths = collectTemplateStaticAssetPaths(
      [
        {
          path: "src/features/public-renderer/templates/restaurant/restaurant-playful.tsx",
          source:
            '<Image src="/assets/restaurant/boca-pop/sticker-plate.svg" /><img src="/assets/bakery/boca-doce/sticker-cake.svg" />',
        },
        {
          path: "src/features/public-renderer/templates/restaurant/restaurant-playful.css",
          source: 'url("/assets/restaurant/boca-pop/confetti-pattern.svg")',
        },
        {
          path: "src/features/public-renderer/templates/restaurant/restaurant-sections.tsx",
          source:
            '"/assets/restaurant/../private.svg" "/assets/restaurant/boca-pop/unsupported.json"',
        },
      ],
      "restaurant",
    );

    expect(paths).toEqual([
      "/assets/restaurant/boca-pop/confetti-pattern.svg",
      "/assets/restaurant/boca-pop/sticker-plate.svg",
    ]);

    expect(
      collectTemplateStaticAssetPaths(
        [
          {
            path: "src/features/public-renderer/templates/bakery/bakery-playful.css",
            source: [
              'url("/assets/bakery/boca-doce/sticker-cake.svg")',
              'url("/assets/bakery/boca-doce/sticker-whisk.svg")',
              'url("/assets/bakery/boca-doce/paper-sprinkles.svg")',
              'url("/assets/bakery/boca-doce/sticker-pastry-bag.svg")',
            ].join(" "),
          },
        ],
        "bakery",
      ),
    ).toHaveLength(4);
  });

  it("does not collect paths for an invalid template key", () => {
    expect(
      collectTemplateStaticAssetPaths(
        [
          {
            path: "source.tsx",
            source: '"/assets/restaurant/boca-pop/sticker-plate.svg"',
          },
        ],
        "../restaurant",
      ),
    ).toEqual([]);
  });
});
