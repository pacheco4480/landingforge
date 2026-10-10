import { universalSections, universalTemplateKey } from "./universal-content";

export const universalTemplate = {
  key: universalTemplateKey,
  name: "Universal Base",
  variants: ["standard", "modern", "premium"],
  supportedSections: universalSections,
} as const;
