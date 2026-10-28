export type ProspectDiscoveryQuery = {
  query: string;
  locality: string;
  limit?: number;
};

export type ProspectDiscoverySuggestion = {
  provider: string;
  providerRecordId: string;
  businessName: string;
  industry: string | null;
  locality: string | null;
  address: string | null;
  website: string | null;
  retrievedAt: string;
  verified: false;
  attribution: string;
};

export interface ProspectDiscoveryProvider {
  search(input: ProspectDiscoveryQuery): Promise<ProspectDiscoverySuggestion[]>;
}

export type DiscoveryProviderResolution =
  | { available: false; reason: "disabled" }
  | { available: true; provider: ProspectDiscoveryProvider };
