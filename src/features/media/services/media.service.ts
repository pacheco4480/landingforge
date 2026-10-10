import type { Prisma } from "@/generated/prisma/client";
import {
  mediaMetadataSchema,
  validateMediaFile,
} from "@/features/media/schemas/media.schema";
import {
  deleteFromStorage,
  uploadToStorage,
} from "@/features/media/services/media-storage.service";
import { getStorageConfig } from "@/lib/storage/supabase-storage";
import { SecurityEventType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { assertRateLimit } from "@/lib/security/rate-limiter";
import { recordSecurityEvent } from "@/lib/security/security-event.service";

export async function listMediaAssets(query?: string) {
  const normalizedQuery = query?.trim();
  return db.mediaAsset.findMany({
    where: {
      deletedAt: null,
      ...(normalizedQuery
        ? {
            OR: [
              { filename: { contains: normalizedQuery } },
              { originalFilename: { contains: normalizedQuery } },
              { mimeType: { contains: normalizedQuery } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      folder: true,
      createdByUser: { select: { name: true, email: true } },
    },
  });
}

export async function listFolders() {
  return db.mediaFolder.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { assets: true, children: true } } },
  });
}

export async function uploadMedia(
  file: File,
  folderId: string | null,
  userId: string,
) {
  await assertRateLimit({ action: "media-upload", key: userId });
  try {
    validateMediaFile(file, getStorageConfig().maxUploadMb);
  } catch (error) {
    await recordSecurityEvent({
      type: SecurityEventType.UPLOAD_BLOCKED,
      scope: "media-upload",
      key: userId,
      metadata: { filename: file.name, mimeType: file.type, size: file.size },
    });
    throw error;
  }
  const uploaded = await uploadToStorage(file);
  const asset = await db.mediaAsset.create({
    data: {
      folderId,
      filename: file.name,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageProvider: "supabase",
      storagePath: uploaded.storagePath,
      publicUrl: uploaded.publicUrl,
      createdByUserId: userId,
      tags: [],
    },
  });
  await auditMedia(userId, "media.upload", asset.id, {
    filename: asset.filename,
  });
  return asset;
}

export async function updateMediaMetadata(input: unknown, userId: string) {
  const data = mediaMetadataSchema.parse(input);
  const asset = await db.mediaAsset.update({
    where: { id: data.id },
    data: {
      filename: data.filename,
      altText: data.altText || null,
      tags: parseTags(data.tags) as Prisma.InputJsonValue,
      folderId: data.folderId || null,
    },
  });
  await auditMedia(userId, "media.update", asset.id, {
    filename: asset.filename,
  });
  return asset;
}

export async function duplicateMedia(id: string, userId: string) {
  const source = await db.mediaAsset.findUniqueOrThrow({ where: { id } });
  const asset = await db.mediaAsset.create({
    data: {
      folderId: source.folderId,
      filename: `${source.filename} Copy`,
      originalFilename: source.originalFilename,
      mimeType: source.mimeType,
      sizeBytes: source.sizeBytes,
      width: source.width,
      height: source.height,
      altText: source.altText,
      storageProvider: `${source.storageProvider}-reference`,
      storagePath: `references/${source.id}-${Date.now()}`,
      publicUrl: source.publicUrl,
      tags: source.tags as Prisma.InputJsonValue,
      createdByUserId: userId,
    },
  });
  await auditMedia(userId, "media.duplicate", asset.id, { sourceId: id });
  return asset;
}

export async function deleteMedia(id: string, userId: string) {
  const asset = await db.mediaAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  if (asset.storageProvider === "supabase") {
    await deleteFromStorage(asset.storagePath);
  }
  await auditMedia(userId, "media.delete", asset.id, {
    filename: asset.filename,
  });
}

export async function createFolder(
  name: string,
  parentId: string | null,
  userId: string,
) {
  const folder = await db.mediaFolder.create({ data: { name, parentId } });
  await auditMedia(userId, "media_folder.create", folder.id, { name });
  return folder;
}

export async function renameFolder(id: string, name: string, userId: string) {
  const folder = await db.mediaFolder.update({ where: { id }, data: { name } });
  await auditMedia(userId, "media_folder.rename", folder.id, { name });
  return folder;
}

export async function deleteFolder(id: string, userId: string) {
  const counts = await db.mediaFolder.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { assets: true, children: true } } },
  });
  if (counts._count.assets > 0 || counts._count.children > 0) {
    throw new Error("Only empty folders can be deleted.");
  }
  await db.mediaFolder.delete({ where: { id } });
  await auditMedia(userId, "media_folder.delete", id, {});
}

function parseTags(tags?: string) {
  return tags
    ? tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
}

async function auditMedia(
  userId: string,
  action: string,
  entityId: string,
  values: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entityType: "media",
      entityId,
      newValues: values as Prisma.InputJsonValue,
    },
  });
}
