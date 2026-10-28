import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rendererFiles = [
  "src/features/public-renderer/types.ts",
  "src/features/public-renderer/section-registry",
  "src/features/public-renderer/components/public-section-renderer.tsx",
  "src/features/public-renderer/components/public-section-list.tsx",
  "src/features/public-renderer/components/public-layout.tsx",
  "src/features/public-renderer/components/public-header.tsx",
  "src/features/public-renderer/components/public-footer.tsx",
  "src/features/public-renderer/components/theme-style.tsx",
  "src/features/public-renderer/components/sections/basic-sections.tsx",
  "src/features/public-renderer/components/sections/contact-section.tsx",
  "src/features/public-renderer/components/forms/public-form.tsx",
  "src/features/legal/components/cookie-consent-banner.tsx",
  "src/features/public-renderer/templates",
];

function collectFiles(path: string): string[] {
  const absolutePath = resolve(path);
  const entries = readdirSync(absolutePath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const childPath = join(absolutePath, entry.name);
    if (entry.isDirectory()) return collectFiles(childPath);
    return /\.[jt]sx?$/.test(entry.name) ? [childPath] : [];
  });
}

describe("public renderer dependency boundary", () => {
  it("keeps public visual modules free of Master-only services", () => {
    const files = rendererFiles.flatMap((path) =>
      path.endsWith(".tsx") || path.endsWith(".ts")
        ? [join(process.cwd(), path)]
        : collectFiles(path),
    );
    const masterOnlyImport =
      /(?:@\/generated\/prisma|@\/lib\/(?:db|auth)|@\/features\/(?:forms\/(?:actions|services)|legal\/(?:actions|schemas|services)|leads|clients|projects|crm|exports))(?:\/|["'])/;

    const violations = files.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return masterOnlyImport.test(content) ? [file] : [];
    });

    expect(violations).toEqual([]);
  });
});
