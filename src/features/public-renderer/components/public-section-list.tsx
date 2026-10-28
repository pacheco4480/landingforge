import type { ComponentType } from "react";

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
        const Section = registry[section.sectionType];
        if (!Section) return null;
        return <Section key={section.id} section={section} context={context} />;
      })}
    </>
  );
}
