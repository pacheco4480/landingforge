import type { ReactNode } from "react";

import { clinicSectionRegistry } from "@/features/public-renderer/section-registry/clinic";
import { ClinicModernReveal } from "@/features/public-renderer/templates/clinic/clinic-modern";
import "@/features/public-renderer/templates/clinic/clinic-modern.css";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";

export const clientRuntimeTemplateEntry: ClientRuntimeTemplateEntry = {
  sectionRegistry: clinicSectionRegistry,
  wrapSections: (children: ReactNode) => <ClinicModernReveal>{children}</ClinicModernReveal>,
};
