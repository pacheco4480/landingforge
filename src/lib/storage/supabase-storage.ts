import { createClient } from "@supabase/supabase-js";

export function getStorageConfig() {
  return {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "landingforge-media",
    maxUploadMb: Number(process.env.MEDIA_MAX_UPLOAD_MB ?? 10),
  };
}

export function isSupabaseStorageConfigured() {
  const config = getStorageConfig();
  return Boolean(config.url && config.serviceRoleKey && config.bucket);
}

export function createSupabaseStorageClient() {
  const config = getStorageConfig();

  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase Storage is not configured.");
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
}
