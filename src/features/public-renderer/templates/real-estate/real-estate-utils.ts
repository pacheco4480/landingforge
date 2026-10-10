import type { PublicRendererContext } from "@/features/public-renderer/types";
import { isRecord, itemText } from "@/features/public-renderer/components/section-utils";

export type RealEstateVariant = "local_agency" | "premium" | "luxury";

export function realEstateVariant(
  context: PublicRendererContext,
): RealEstateVariant {
  const variant = context.page.templateVariant?.key;

  if (variant === "premium" || variant === "luxury") return variant;

  return "local_agency";
}

export function variantLabel(variant: RealEstateVariant) {
  const labels: Record<RealEstateVariant, string> = {
    local_agency: "Local Agency",
    premium: "Premium",
    luxury: "Luxury",
  };

  return labels[variant];
}

export function realEstateToneClasses(variant: RealEstateVariant) {
  if (variant === "luxury") {
    return {
      hero:
        "bg-slate-950 text-white shadow-[0_24px_80px_rgba(2,6,23,0.28)]",
      muted: "text-white/72",
      card: "border-white/10 bg-white/8 text-white",
      badge: "border-white/20 bg-white/10 text-white",
      surface: "bg-slate-950 text-white",
    };
  }

  if (variant === "premium") {
    return {
      hero:
        "bg-[var(--public-surface)] text-[var(--public-text)] shadow-[0_18px_70px_rgba(15,23,42,0.12)]",
      muted: "text-[var(--public-muted)]",
      card: "border-black/10 bg-white text-[var(--public-text)]",
      badge:
        "border-[var(--public-primary)]/20 bg-[var(--public-primary)]/8 text-[var(--public-primary)]",
      surface: "bg-[var(--public-surface)] text-[var(--public-text)]",
    };
  }

  return {
    hero:
      "bg-[var(--public-primary)] text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)]",
    muted: "text-white/80",
    card: "border-white/14 bg-white/10 text-white",
    badge: "border-white/24 bg-white/12 text-white",
    surface: "bg-[var(--public-surface)] text-[var(--public-text)]",
  };
}

export function recordText(
  item: Record<string, unknown>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const value = itemText(item, key);
    if (value) return value;
  }

  return fallback;
}

export function recordArray(content: unknown, key: string) {
  if (!isRecord(content) || !Array.isArray(content[key])) return [];

  return content[key].filter(isRecord);
}
