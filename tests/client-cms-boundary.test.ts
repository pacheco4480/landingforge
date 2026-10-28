import { describe, expect, it } from "vitest";

import { getClientRuntimeTemplateProfile, listClientRuntimeTemplateProfiles } from "@/features/exports/services/client-runtime-catalog";
import { collectClientRuntimeSourceGraph } from "@/features/exports/services/client-runtime-source-graph";

describe("client CMS and Landing Only boundary", () => {
  it("never pulls CMS, auth, or database modules into a Landing Only template graph", () => {
    for (const profile of listClientRuntimeTemplateProfiles()) {
      expect(getClientRuntimeTemplateProfile(profile.templateKey, profile.variantKey)).not.toBeNull();
      const graph = collectClientRuntimeSourceGraph(profile.templateKey, profile.variantKey);
      expect(graph.files.some((file) => file.includes("/cms/"))).toBe(false);
      expect(graph.files.some((file) => file.includes("/client-runtime/cms/"))).toBe(false);
    }
  }, 30000);
});
