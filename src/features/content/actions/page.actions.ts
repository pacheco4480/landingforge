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
import { invalidateMaintenanceCandidate } from "@/features/projects/services/project-maintenance.service";

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
  const existingPage = await getPageForUser(id, user.roles, user);
  if (existingPage.maintenanceCandidate?.status === "PUBLISHED") {
    throw new Error("Uma release publicada é imutável. Cria uma nova versão de manutenção.");
  }
  if (existingPage.maintenanceCandidate && formValue(formData, "status") !== "DRAFT") {
    throw new Error("Uma versão candidata de manutenção nunca pode ser publicada diretamente pelo CMS.");
  }
  if (
    existingPage.maintenanceCandidate &&
    (formValue(formData, "templateId") !== (existingPage.templateId ?? "") ||
      formValue(formData, "templateVariantId") !== (existingPage.templateVariantId ?? ""))
  ) {
    throw new Error("A variante da cópia de manutenção não pode ser alterada neste fluxo.");
  }

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
  await invalidateMaintenanceCandidate(id);

  revalidatePath("/pages");
  revalidatePath(`/pages/${id}/edit`);
  revalidatePublicPage(existingPage.slug);
  revalidatePublicPage(page.slug);
}

export async function duplicatePageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const id = formValue(formData, "id");
  await getPageForUser(id, user.roles, user);
  const page = await duplicatePage(id, user.id);

  revalidatePath("/pages");
  revalidatePublicPage(page.slug);
  redirect(`/pages/${page.id}/edit`);
}

export async function archivePageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const id = formValue(formData, "id");
  const page = await getPageForUser(id, user.roles, user);
  if (page.maintenanceCandidate) throw new Error("Uma versão candidata não pode ser arquivada pelo CMS.");
  await archivePage(id, user.id);

  revalidatePath("/pages");
  revalidatePath(`/pages/${id}/edit`);
  revalidatePublicPage(page.slug);
}

export async function deletePageAction(formData: FormData) {
  const user = await requirePermission(permissions.pagesWrite);
  const id = formValue(formData, "id");
  const page = await getPageForUser(id, user.roles, user);
  if (page.maintenanceCandidate) throw new Error("Uma versão candidata não pode ser eliminada pelo CMS.");
  await deletePage(id, user.id);

  revalidatePath("/pages");
  revalidatePublicPage(page.slug);
  redirect("/pages");
}
