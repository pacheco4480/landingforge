import type { ComponentType } from "react";

import { resolvePublicSectionType } from "@/features/public-renderer/template-registry";
import type { PublicRendererContext, PublicSectionProps } from "@/features/public-renderer/types";

export function PublicSectionList({
  context,
  registry,
}: {
  context: PublicRendererContext;
  registry: Record<string, ComponentType<PublicSectionProps>>;
}) {
  return (
    <>
      {context.page.sections.map((section) => {
        if (!section.isVisible) return null;

        const sectionType = resolvePublicSectionType(
          context.page.template?.key,
          section.sectionKey,
          section.sectionType,
        );
        const Section = registry[sectionType];
        if (!Section) return null;
        const resolvedSection = sectionType === section.sectionType
          ? section
          : { ...section, sectionType };
        return <Section key={section.id} section={resolvedSection} context={context} />;
      })}
    </>
  );
}
