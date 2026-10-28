import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export type ClientRuntimeTemplateProfile = {
  templateKey: string;
  variantKey: string;
  entrypoint: string;
  load: () => Promise<ClientRuntimeTemplateEntry>;
};

const profiles: Record<string, ClientRuntimeTemplateProfile> = {
  "real_estate:local_agency": {
    templateKey: "real_estate",
    variantKey: "local_agency",
    entrypoint: "src/features/exports/client-runtime/entrypoints/real-estate/local-agency.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/real-estate/local-agency")).clientRuntimeTemplateEntry,
  },
  "real_estate:premium": {
    templateKey: "real_estate",
    variantKey: "premium",
    entrypoint: "src/features/exports/client-runtime/entrypoints/real-estate/premium.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/real-estate/premium")).clientRuntimeTemplateEntry,
  },
  "clinic:modern": {
    templateKey: "clinic",
    variantKey: "modern",
    entrypoint: "src/features/exports/client-runtime/entrypoints/clinic/modern.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/clinic/modern")).clientRuntimeTemplateEntry,
  },
  "clinic:luxury": {
    templateKey: "clinic",
    variantKey: "luxury",
    entrypoint: "src/features/exports/client-runtime/entrypoints/clinic/luxury.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/clinic/luxury")).clientRuntimeTemplateEntry,
  },
  "restaurant:fine_dining": {
    templateKey: "restaurant",
    variantKey: "fine_dining",
    entrypoint: "src/features/exports/client-runtime/entrypoints/restaurant/fine-dining.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/restaurant/fine-dining")).clientRuntimeTemplateEntry,
  },
  "restaurant:playful": {
    templateKey: "restaurant",
    variantKey: "playful",
    entrypoint: "src/features/exports/client-runtime/entrypoints/restaurant/playful.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/restaurant/playful")).clientRuntimeTemplateEntry,
  },
  "bakery:playful": {
    templateKey: "bakery",
    variantKey: "playful",
    entrypoint: "src/features/exports/client-runtime/entrypoints/bakery/playful.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/bakery/playful")).clientRuntimeTemplateEntry,
  },
  "gym:modern": {
    templateKey: "gym",
    variantKey: "modern",
    entrypoint: "src/features/exports/client-runtime/entrypoints/gym/modern.tsx",
    load: async () => (await import("@/features/exports/client-runtime/entrypoints/gym/modern")).clientRuntimeTemplateEntry,
  },
};

export function getClientRuntimeTemplateProfile(templateKey: string, variantKey: string) {
  return profiles[`${templateKey}:${variantKey}`] ?? null;
}

export function listClientRuntimeTemplateProfiles() {
  return Object.values(profiles).map(({ templateKey, variantKey, entrypoint }) => ({
    templateKey,
    variantKey,
    entrypoint,
  }));
}
