import type { ReactNode } from "react";

import { clinicSectionRegistry } from "@/features/public-renderer/section-registry/clinic";
import { ClinicLuxuryReveal } from "@/features/public-renderer/templates/clinic/clinic-luxury";
import "@/features/public-renderer/templates/clinic/clinic-luxury.css";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export const clientRuntimeTemplateEntry: ClientRuntimeTemplateEntry = {
  sectionRegistry: clinicSectionRegistry,
  wrapSections: (children: ReactNode) => <ClinicLuxuryReveal>{children}</ClinicLuxuryReveal>,
};
