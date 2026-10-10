"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { permissions } from "@/features/rbac/permissions";
import {
  archivePage,
  createPage,
  deletePage,
  duplicatePage,
  getPageForUser,
  updatePage,
} from "@/features/content/services/page.service";
import { revalidatePublicPage } from "@/features/public-renderer/services/public-cache.service";
import { requirePermission } from "@/lib/auth/require-permission";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createPageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const page = await createPage(
    {
      title: formValue(formData, "title"),
      slug: formValue(formData, "slug"),
      status: formValue(formData, "status"),
      pageType: formValue(formData, "pageType"),
      templateId: formValue(formData, "templateId"),
      templateVariantId: formValue(formData, "templateVariantId"),
    },
    user.id,
  );

  revalidatePath("/pages");
  revalidatePublicPage(page.slug);
  redirect(`/pages/${page.id}/edit`);
}

export async function updatePageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const id = formValue(formData, "id");
  const existingPage = await getPageForUser(id, user.roles);

  const page = await updatePage(
    {
      id,
      title: formValue(formData, "title"),
      slug: formValue(formData, "slug"),
      status: formValue(formData, "status"),
      pageType: formValue(formData, "pageType"),
      templateId: formValue(formData, "templateId"),
      templateVariantId: formValue(formData, "templateVariantId"),
    },
    user.id,
  );

  revalidatePath("/pages");
  revalidatePath(`/pages/${id}/edit`);
  revalidatePublicPage(existingPage.slug);
  revalidatePublicPage(page.slug);
}

export async function duplicatePageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const id = formValue(formData, "id");
  await getPageForUser(id, user.roles);
  const page = await duplicatePage(id, user.id);

  revalidatePath("/pages");
  revalidatePublicPage(page.slug);
  redirect(`/pages/${page.id}/edit`);
}

export async function archivePageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const id = formValue(formData, "id");
  const page = await getPageForUser(id, user.roles);
  await archivePage(id, user.id);

  revalidatePath("/pages");
  revalidatePath(`/pages/${id}/edit`);
  revalidatePublicPage(page.slug);
}

export async function deletePageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const id = formValue(formData, "id");
  const page = await getPageForUser(id, user.roles);
  await deletePage(id, user.id);

  revalidatePath("/pages");
  revalidatePublicPage(page.slug);
  redirect("/pages");
}
