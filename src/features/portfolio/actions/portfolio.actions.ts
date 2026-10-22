"use server";

import { revalidatePath } from "next/cache";

import {
  archivePortfolioScreenshot,
  createPortfolioScreenshot,
  updatePortfolioScreenshotVisibility,
} from "@/features/portfolio/services/portfolio-screenshot.service";
import { updatePortfolioVisibility } from "@/features/portfolio/services/portfolio.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function updatePortfolioVisibilityAction(formData: FormData) {
  const user = await requirePermission(permissions.adminAccess);
  const sortValue = value(formData, "sortOrder");
  await updatePortfolioVisibility({
    pageId: value(formData, "pageId"),
    isPublic: formData.has("isPublic"),
    sortOrder: sortValue ? Number(sortValue) : null,
  }, user.id);
  revalidatePortfolioPaths(value(formData, "slug"));
}

export async function createPortfolioScreenshotAction(formData: FormData) {
  const user = await requirePermission(permissions.adminAccess);
  await createPortfolioScreenshot(formData, user.id);
  revalidatePortfolioPaths(value(formData, "slug"));
}

export async function updatePortfolioScreenshotVisibilityAction(formData: FormData) {
  const user = await requirePermission(permissions.adminAccess);
  await updatePortfolioScreenshotVisibility({ id: value(formData, "id"), isPublic: formData.has("isPublic") }, user.id);
  revalidatePath("/portfolio");
}

export async function archivePortfolioScreenshotAction(formData: FormData) {
  const user = await requirePermission(permissions.adminAccess);
  await archivePortfolioScreenshot(value(formData, "id"), user.id);
  revalidatePath("/portfolio");
}

function revalidatePortfolioPaths(slug: string) {
  revalidatePath("/portfolio");
  revalidatePath(`/templates/${slug}`);
  revalidatePath("/industries/[slug]", "page");
}
