import type { ComponentType, ReactNode } from "react";

import type { PublicSectionProps } from "@/features/public-renderer/types";

export type ClientRuntimeTemplateEntry = {
  sectionRegistry: Record<string, ComponentType<PublicSectionProps>>;
  wrapSections: (children: ReactNode) => ReactNode;
};
