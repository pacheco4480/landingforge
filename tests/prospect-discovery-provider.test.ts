import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveProspectDiscoveryProvider } from "@/features/prospects/providers/discovery-provider-resolver";

describe("prospect discovery provider boundary", () => {
  it("keeps automated discovery disabled until a source is approved", () => {
    expect(resolveProspectDiscoveryProvider()).toEqual({ available: false, reason: "disabled" });
  });

  it("does not make external requests", () => {
    const fetcher = vi.fn<typeof fetch>();
    expect(resolveProspectDiscoveryProvider()).toEqual({ available: false, reason: "disabled" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
