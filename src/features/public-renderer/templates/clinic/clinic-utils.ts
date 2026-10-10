import { isRecord, itemText } from "@/features/public-renderer/components/section-utils";
import type { PublicRendererContext } from "@/features/public-renderer/types";

export type ClinicVariant = "corporate" | "modern" | "luxury";

export function clinicVariant(context: PublicRendererContext): ClinicVariant {
  const variant = context.page.templateVariant?.key;

  if (variant === "corporate" || variant === "luxury") return variant;

  return "modern";
}

export function clinicVariantLabel(variant: ClinicVariant) {
  const labels: Record<ClinicVariant, string> = {
    corporate: "Corporate",
    luxury: "Luxury",
    modern: "Modern",
  };

  return labels[variant];
}

export function clinicToneClasses(variant: ClinicVariant) {
  if (variant === "luxury") {
    return {
      badge: "border-white/15 bg-white/8 text-white",
      card: "border-white/10 bg-white/8 text-white",
      hero: "bg-slate-950 text-white shadow-[0_24px_80px_rgba(2,6,23,0.28)]",
      muted: "text-white/68",
      surface: "bg-slate-950 text-white",
    };
  }

  if (variant === "corporate") {
    return {
      badge:
        "border-[var(--public-primary)]/20 bg-[var(--public-primary)]/8 text-[var(--public-primary)]",
      card: "border-slate-200 bg-white text-slate-950",
      hero:
        "bg-white text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.10)]",
      muted: "text-slate-600",
      surface: "bg-slate-50 text-slate-950",
    };
  }

  return {
    badge:
      "border-[var(--public-secondary)]/20 bg-[var(--public-secondary)]/8 text-[var(--public-primary)]",
    card: "border-slate-200/80 bg-white text-slate-950",
    hero:
      "bg-[#f3fbfb] text-slate-950 shadow-[0_18px_60px_rgba(15,118,110,0.10)]",
    muted: "text-slate-600",
    surface: "bg-[#f7fbfb] text-slate-950",
  };
}

export function recordArray(content: unknown, key: string) {
  if (!isRecord(content) || !Array.isArray(content[key])) return [];

  return content[key].filter(isRecord);
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
