import "server-only";

import type { DiscoveryProviderResolution } from "@/features/prospects/providers/discovery-provider";

// Automated discovery stays unavailable until a source is approved for prospecting use.
export function resolveProspectDiscoveryProvider(): DiscoveryProviderResolution {
  return { available: false, reason: "disabled" };
}
