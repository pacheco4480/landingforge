import { sectionRegistry } from "@/features/public-renderer/section-registry";
import type {
  PublicRendererContext,
  PublicSectionProps,
} from "@/features/public-renderer/types";

export function PublicSectionRenderer({
  context,
}: {
  context: PublicRendererContext;
}) {
  return (
    <>
      {context.page.sections.map((section) => {
        const Section = sectionRegistry[section.sectionType] as
          | ((props: PublicSectionProps) => React.ReactNode)
          | undefined;
        if (!Section) return null;
        return <Section key={section.id} section={section} context={context} />;
      })}
    </>
  );
}
