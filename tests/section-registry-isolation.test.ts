import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";

import { bakerySectionRegistry } from "@/features/public-renderer/section-registry/bakery";
import { clinicSectionRegistry } from "@/features/public-renderer/section-registry/clinic";
import { gymSectionRegistry } from "@/features/public-renderer/section-registry/gym";
import { realEstateSectionRegistry } from "@/features/public-renderer/section-registry/real-estate";
import { restaurantSectionRegistry } from "@/features/public-renderer/section-registry/restaurant";
import { sectionRegistry } from "@/features/public-renderer/section-registry";
import { gymModernSectionRegistry } from "@/features/public-renderer/templates/gym/gym-modern";

const industryRegistries = {
  real_estate: realEstateSectionRegistry,
  clinic: clinicSectionRegistry,
  restaurant: restaurantSectionRegistry,
  bakery: bakerySectionRegistry,
  gym: gymSectionRegistry,
};

const registryEntrypoints: Record<keyof typeof industryRegistries, string> = {
  real_estate: "src/features/public-renderer/section-registry/real-estate.ts",
  clinic: "src/features/public-renderer/section-registry/clinic.ts",
  restaurant: "src/features/public-renderer/section-registry/restaurant.ts",
  bakery: "src/features/public-renderer/section-registry/bakery.ts",
  gym: "src/features/public-renderer/section-registry/gym.ts",
};

const industryFolders: Record<keyof typeof industryRegistries, string> = {
  real_estate: "real-estate",
  clinic: "clinic",
  restaurant: "restaurant",
  bakery: "bakery",
  gym: "gym",
};

function collectLocalImports(entrypoint: string) {
  const visited = new Set<string>();
  const pending = [resolve(process.cwd(), entrypoint)];
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".css", "/index.ts", "/index.tsx"];

  while (pending.length) {
    const file = pending.pop()!;
    if (visited.has(file)) continue;
    visited.add(file);
    const source = readFileSync(file, "utf8");
    const importPattern = /(?:from\s*)?["']@\/([^"']+)["']/g;

    for (const match of source.matchAll(importPattern)) {
      const stem = resolve(process.cwd(), "src", match[1]);
      const target = [stem, ...extensions.map((extension) => `${stem}${extension}`)].find(
        (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
      );
      if (target && !visited.has(target)) pending.push(target);
    }
  }

  return [...visited].map((file) => file.replaceAll("\\", "/"));
}

describe("industry section registries", () => {
  it("keep industry section keys within their own registry", () => {
    const prefixes = Object.keys(industryRegistries);

    for (const [industry, registry] of Object.entries(industryRegistries)) {
      const foreignSections = Object.keys(registry).filter((key) =>
        prefixes.some((prefix) => prefix !== industry && key.startsWith(`${prefix}_`)),
      );
      expect(foreignSections, industry).toEqual([]);
    }
  });

  it("preserve the Master aggregate registry as the union of industry maps", () => {
    const aggregateKeys = new Set(Object.keys(sectionRegistry));
    const industryKeys = new Set(Object.values(industryRegistries).flatMap(Object.keys));

    expect([...industryKeys].every((key) => aggregateKeys.has(key))).toBe(true);
    expect(Object.keys(sectionRegistry)).toContain("real_estate_hero");
    expect(Object.keys(sectionRegistry)).toContain("clinic_hero");
    expect(Object.keys(sectionRegistry)).toContain("restaurant_hero");
    expect(Object.keys(sectionRegistry)).toContain("bakery_hero");
    expect(Object.keys(sectionRegistry)).toContain("gym_hero");
  });

  it("keeps the Gym Modern map limited to base and Gym sections", () => {
    expect(Object.keys(gymModernSectionRegistry)).toContain("gym_classes");
    expect(Object.keys(gymModernSectionRegistry)).toContain("gym_transformations");
    expect(Object.keys(gymModernSectionRegistry)).not.toContain("clinic_doctors");
    expect(Object.keys(gymModernSectionRegistry)).not.toContain("restaurant_menu_highlights");
  });

  it("keeps each industry's local import graph out of other industry folders", () => {
    for (const industry of Object.keys(industryRegistries) as (keyof typeof industryRegistries)[]) {
      const graph = collectLocalImports(registryEntrypoints[industry]);
      const foreignIndustryFiles = graph.filter((file) => {
        const match = file.match(/\/templates\/([^/]+)\//);
        return match && match[1] !== industryFolders[industry];
      });

      expect(foreignIndustryFiles, industry).toEqual([]);
    }
  });
});
