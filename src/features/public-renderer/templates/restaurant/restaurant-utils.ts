import { isRecord, itemText } from "@/features/public-renderer/components/section-utils";
import type { PublicRendererContext } from "@/features/public-renderer/types";

export type RestaurantVariant = "casual" | "premium" | "fine_dining" | "playful";

export function restaurantVariant(
  context: PublicRendererContext,
): RestaurantVariant {
  const variant = context.page.templateVariant?.key;

  if (
    variant === "casual" ||
    variant === "premium" ||
    variant === "playful"
  ) {
    return variant;
  }

  return "fine_dining";
}

export function restaurantVariantLabel(variant: RestaurantVariant) {
  const labels: Record<RestaurantVariant, string> = {
    casual: "Casual",
    fine_dining: "Fine Dining",
    playful: "Playful",
    premium: "Premium",
  };

  return labels[variant];
}

export function restaurantToneClasses(variant: RestaurantVariant) {
  if (variant === "playful") {
    return {
      badge: "border-[#ff6b35]/30 bg-[#ff6b35]/12 text-[#7c2d12]",
      card: "border-[#ffd166]/60 bg-white text-slate-950 shadow-[0_16px_44px_rgba(124,45,18,0.10)]",
      hero: "bg-[#fff7ed] text-slate-950",
      muted: "text-slate-600",
      surface: "bg-[#fff7ed] text-slate-950",
    };
  }

  if (variant === "premium") {
    return {
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-200",
      card: "border-white/12 bg-white/8 text-white",
      hero: "bg-[#111827] text-white",
      muted: "text-white/68",
      surface: "bg-[#111827] text-white",
    };
  }

  if (variant === "casual") {
    return {
      badge: "border-red-700/20 bg-red-700/8 text-red-800",
      card: "border-orange-200 bg-white text-slate-950",
      hero: "bg-[#fff8f0] text-slate-950",
      muted: "text-slate-600",
      surface: "bg-[#fff8f0] text-slate-950",
    };
  }

  return {
    badge: "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f7df91]",
    card: "border-white/12 bg-white/8 text-white",
    hero: "bg-slate-950 text-white",
    muted: "text-white/66",
    surface: "bg-slate-950 text-white",
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

export function brandKitText(content: unknown, key: string, fallback = "") {
  if (!isRecord(content) || !isRecord(content.brandKit)) return fallback;

  const value = content.brandKit[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}
