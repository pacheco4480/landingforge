import { randomUUID } from "node:crypto";

import {
  SystemLogLevel,
  SystemLogSource,
} from "@/generated/prisma/client";
import { logMonitoringEvent } from "@/features/monitoring/services/logger.service";
import {
  createSupabaseStorageClient,
  getStorageConfig,
  isSupabaseStorageConfigured,
} from "@/lib/storage/supabase-storage";

export async function uploadToStorage(file: File) {
  const config = getStorageConfig();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const storagePath = `uploads/${new Date().getFullYear()}/${randomUUID()}-${safeName}`;

  if (!isSupabaseStorageConfigured()) {
    await logMonitoringEvent({
      level: SystemLogLevel.WARNING,
      source: SystemLogSource.STORAGE,
      message: "Supabase Storage não está configurado.",
      action: "storage.upload",
      metadata: { filename: safeName, mimeType: file.type, size: file.size },
    });
    throw new Error("Supabase Storage is not configured.");
  }

  const client = createSupabaseStorageClient();
  const { error } = await client.storage
    .from(config.bucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    await logMonitoringEvent({
      level: SystemLogLevel.ERROR,
      source: SystemLogSource.STORAGE,
      message: error.message,
      action: "storage.upload",
      metadata: { filename: safeName, mimeType: file.type, size: file.size },
    });
    throw new Error(error.message);
  }

  const { data } = client.storage.from(config.bucket).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

export async function deleteFromStorage(storagePath: string) {
  if (!isSupabaseStorageConfigured()) return;
  const config = getStorageConfig();
  const client = createSupabaseStorageClient();
  const { error } = await client.storage.from(config.bucket).remove([storagePath]);
  if (error) {
    await logMonitoringEvent({
      level: SystemLogLevel.WARNING,
      source: SystemLogSource.STORAGE,
      message: error.message,
      action: "storage.delete",
      metadata: { storagePath },
    });
  }
}
