import { sectionRegistry } from "@/features/public-renderer/section-registry";
import { EstateMotion } from "@/features/public-renderer/templates/real-estate/estate-motion";
import { ClinicModernReveal } from "@/features/public-renderer/templates/clinic";
import "@/features/public-renderer/templates/clinic/clinic-modern.css";
import { ClinicLuxuryReveal } from "@/features/public-renderer/templates/clinic/clinic-luxury";
import "@/features/public-renderer/templates/clinic/clinic-luxury.css";
import { FineDiningReveal } from "@/features/public-renderer/templates/restaurant/restaurant-fine-dining";
import "@/features/public-renderer/templates/restaurant/restaurant-fine-dining.css";
import { RestaurantPlayfulReveal } from "@/features/public-renderer/templates/restaurant/restaurant-playful";
import "@/features/public-renderer/templates/restaurant/restaurant-playful.css";
import {
  bakeryPlayfulSectionRegistry,
  BakeryPlayfulReveal,
} from "@/features/public-renderer/templates/bakery/bakery-playful";
import "@/features/public-renderer/templates/bakery/bakery-playful.css";
import {
  gymModernSectionRegistry,
  GymModernReveal,
} from "@/features/public-renderer/templates/gym/gym-modern";
import "@/features/public-renderer/templates/gym/gym-modern.css";
import type {
  PublicRendererContext,
  PublicSectionProps,
} from "@/features/public-renderer/types";

export function PublicSectionRenderer({
  context,
}: {
  context: PublicRendererContext;
}) {
  const variant = context.page.templateVariant?.key;
  const sections = (
    <>
      {context.page.sections.map((section) => {
        const sectionMap =
          context.page.template?.key === "bakery" && variant === "playful"
            ? bakeryPlayfulSectionRegistry
            : context.page.template?.key === "gym" && variant === "modern"
              ? gymModernSectionRegistry
              : sectionRegistry;
        const Section = sectionMap[section.sectionType] as
          | ((props: PublicSectionProps) => React.ReactNode)
          | undefined;
        if (!Section) return null;
        return <Section key={section.id} section={section} context={context} />;
      })}
    </>
  );
  if (context.page.template?.key === "bakery" && variant === "playful") {
    return <BakeryPlayfulReveal>{sections}</BakeryPlayfulReveal>;
  }
  if (context.page.template?.key === "gym" && variant === "modern") {
    return <GymModernReveal>{sections}</GymModernReveal>;
  }
  if (
    context.page.template?.key === "real_estate" &&
    (variant === "local_agency" || variant === "premium")
  ) {
    return (
      <EstateMotion premium={variant === "premium"}>{sections}</EstateMotion>
    );
  }
  if (context.page.template?.key === "clinic" && variant === "modern") {
    return <ClinicModernReveal>{sections}</ClinicModernReveal>;
  }
  if (context.page.template?.key === "clinic" && variant === "luxury") {
    return <ClinicLuxuryReveal>{sections}</ClinicLuxuryReveal>;
  }
  if (context.page.template?.key === "restaurant" && variant === "fine_dining") {
    return <FineDiningReveal>{sections}</FineDiningReveal>;
  }
  if (context.page.template?.key === "restaurant" && variant === "playful") {
    return <RestaurantPlayfulReveal>{sections}</RestaurantPlayfulReveal>;
  }
  return sections;
}
