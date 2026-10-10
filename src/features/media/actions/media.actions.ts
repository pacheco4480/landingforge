"use server";

import { revalidatePath } from "next/cache";

import {
  createFolder,
  deleteFolder,
  deleteMedia,
  duplicateMedia,
  renameFolder,
  updateMediaMetadata,
  uploadMedia,
} from "@/features/media/services/media.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function uploadMediaAction(formData: FormData) {
  const user = await requirePermission(permissions.mediaWrite);
  const files = formData
    .getAll("files")
    .filter((file): file is File => file instanceof File);
  const folderId = value(formData, "folderId") || null;

  for (const file of files) {
    if (file.size > 0) {
      await uploadMedia(file, folderId, user.id);
    }
  }
  revalidatePath("/media");
}

export async function updateMediaMetadataAction(formData: FormData) {
  const user = await requirePermission(permissions.mediaWrite);
  await updateMediaMetadata(
    {
      id: value(formData, "id"),
      filename: value(formData, "filename"),
      altText: value(formData, "altText"),
      tags: value(formData, "tags"),
      folderId: value(formData, "folderId"),
    },
    user.id,
  );
  revalidatePath("/media");
}

export async function duplicateMediaAction(formData: FormData) {
  const user = await requirePermission(permissions.mediaWrite);
  await duplicateMedia(value(formData, "id"), user.id);
  revalidatePath("/media");
}

export async function deleteMediaAction(formData: FormData) {
  const user = await requirePermission(permissions.mediaWrite);
  await deleteMedia(value(formData, "id"), user.id);
  revalidatePath("/media");
}

export async function createFolderAction(formData: FormData) {
  const user = await requirePermission(permissions.mediaWrite);
  await createFolder(
    value(formData, "name"),
    value(formData, "parentId") || null,
    user.id,
  );
  revalidatePath("/media");
}

export async function renameFolderAction(formData: FormData) {
  const user = await requirePermission(permissions.mediaWrite);
  await renameFolder(value(formData, "id"), value(formData, "name"), user.id);
  revalidatePath("/media");
}

export async function deleteFolderAction(formData: FormData) {
  const user = await requirePermission(permissions.mediaWrite);
  await deleteFolder(value(formData, "id"), user.id);
  revalidatePath("/media");
}
