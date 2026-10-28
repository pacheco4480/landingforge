import { getTemplateDefinition } from "@/features/public-renderer/template-registry";
import { buildClientRuntimePayload, type ClientRuntimePayload } from "@/features/exports/services/client-runtime-payload";
import { getClientRuntimeTemplateProfile } from "@/features/exports/services/client-runtime-catalog";
import { collectClientRuntimeSourceGraph } from "@/features/exports/services/client-runtime-source-graph";
import {
  getProjectSourceSnapshotChecksum,
  type ProjectSourceSnapshot,
} from "@/features/exports/services/project-source-snapshot";

export type ClientDeliveryProfile = {
  siteManagementOwner: "LANDINGFORGE" | "CLIENT" | "SHARED" | "NOT_APPLICABLE";
  hostingOwner: "LANDINGFORGE" | "CLIENT" | "SHARED" | "NOT_APPLICABLE";
  domainOwner: "LANDINGFORGE" | "CLIENT" | "SHARED" | "NOT_APPLICABLE";
  contentOwner: "LANDINGFORGE" | "CLIENT" | "SHARED" | "NOT_APPLICABLE";
  publishingOwner: "LANDINGFORGE" | "CLIENT" | "SHARED" | "NOT_APPLICABLE";
  maintenancePlan: "NONE" | "ON_DEMAND" | "CONTRACTED";
  maintenanceScope: string | null;
  maintenanceChannel: string | null;
  maintenanceWindow: string | null;
};

export type ClientRuntimeComposition = {
  format: "landingforge-client-composition";
  formatVersion: 1;
  mode: "LANDING_ONLY" | "LANDING_WITH_CMS";
  template: {
    key: string;
    variantKey: string;
    entrypoint: string;
    sourceFiles: string[];
    dependencies: string[];
  };
  payload: ClientRuntimePayload;
  sourceChecksum: string;
  capabilities: ProjectSourceSnapshot["capabilities"];
  deliveryProfile?: ClientDeliveryProfile;
  cmsBootstrap: { projectId: string; sourceChecksum: string; snapshot: ProjectSourceSnapshot } | null;
  maintenanceRelease?: { projectId: string; version: number; sourceChecksum: string };
};

export function buildClientRuntimeComposition(
  snapshot: ProjectSourceSnapshot,
  expectedChecksum?: string,
  mode: ClientRuntimeComposition["mode"] = "LANDING_ONLY",
  projectId?: string,
  maintenanceRelease?: ClientRuntimeComposition["maintenanceRelease"],
  deliveryProfile?: ClientDeliveryProfile,
): ClientRuntimeComposition {
  const payload = buildClientRuntimePayload(snapshot, expectedChecksum);
  const variantKey = payload.variantKey;
  const profile = getClientRuntimeTemplateProfile(payload.templateKey, variantKey);
  if (!profile) {
    throw new Error("A combinação de template e variante não tem um runtime cliente aprovado.");
  }

  const templateDefinition = getTemplateDefinition(profile.templateKey);
  if (!templateDefinition) {
    throw new Error("O runtime cliente não tem uma declaração de secções disponível.");
  }
  const unsupportedSections = payload.page.sections
    .filter(({ sectionType }) => !templateDefinition.supportedSections.includes(sectionType))
    .map(({ sectionType }) => sectionType);
  if (unsupportedSections.length) {
    throw new Error(`O conteúdo contém secções não suportadas: ${[...new Set(unsupportedSections)].join(", ")}.`);
  }
  const sourceGraph = collectClientRuntimeSourceGraph(profile.templateKey, profile.variantKey);
  if (mode === "LANDING_WITH_CMS" && (!projectId || !expectedChecksum)) {
    throw new Error("A entrega CMS exige um Project e um checksum de fonte fixada.");
  }

  return {
    format: "landingforge-client-composition",
    formatVersion: 1,
    mode,
    template: {
      key: profile.templateKey,
      variantKey: profile.variantKey,
      entrypoint: profile.entrypoint,
      sourceFiles: sourceGraph.files,
      dependencies: sourceGraph.dependencies,
    },
    payload: cloneRuntimePayload(payload),
    sourceChecksum: expectedChecksum ?? getProjectSourceSnapshotChecksum(snapshot),
    capabilities: JSON.parse(JSON.stringify(snapshot.capabilities)) as ProjectSourceSnapshot["capabilities"],
    ...(deliveryProfile ? { deliveryProfile: { ...deliveryProfile } } : {}),
    cmsBootstrap: mode === "LANDING_WITH_CMS"
      ? { projectId: projectId!, sourceChecksum: expectedChecksum!, snapshot: JSON.parse(JSON.stringify(snapshot)) as ProjectSourceSnapshot }
      : null,
    ...(maintenanceRelease ? { maintenanceRelease } : {}),
  };
}

function cloneRuntimePayload(payload: ClientRuntimePayload): ClientRuntimePayload {
  return JSON.parse(JSON.stringify(payload)) as ClientRuntimePayload;
}
