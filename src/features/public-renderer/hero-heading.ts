import type {
  PublicPageSection,
  PublicRendererContext,
} from "@/features/public-renderer/types";

export function isPrimaryHeroSection(
  section: PublicPageSection,
  context: PublicRendererContext,
) {
  const firstHero = context.page.sections.find(
    (candidate) =>
      candidate.sectionType === "hero" ||
      candidate.sectionType.endsWith("_hero"),
  );

  return firstHero?.id === section.id;
}
