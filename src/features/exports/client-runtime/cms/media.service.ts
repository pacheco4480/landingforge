import "server-only";

import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { getActorInstallation, requireClientCmsActor } from "./authorization";
import { getClientCmsPool, withClientCmsTransaction } from "./database";

const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxUploadBytes = 10 * 1024 * 1024;

function storageConfig() {
  const url = process.env.CLIENT_CMS_SUPABASE_URL;
  const key = process.env.CLIENT_CMS_SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.CLIENT_CMS_PUBLIC_MEDIA_BUCKET;
  if (!url || !key || !bucket) throw new Error("O storage desta instalação não está configurado.");
  return { client: createClient(url, key, { auth: { persistSession: false } }), bucket };
}

export async function uploadClientCmsMedia(file: File, altText = "") {
  const actor = await requireClientCmsActor("media.write");
  const projectId = getActorInstallation(actor).projectId;
  if (!acceptedMimeTypes.has(file.type) || file.size <= 0 || file.size > maxUploadBytes) {
    throw new Error("O ficheiro tem de ser uma imagem suportada até 10 MB.");
  }
  const config = storageConfig();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "image";
  const objectPath = `${projectId}/${randomUUID()}-${safeFilename}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(file.type, bytes)) throw new Error("O conteúdo do ficheiro não corresponde ao formato de imagem indicado.");
  const upload = await config.client.storage.from(config.bucket).upload(objectPath, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) throw new Error("Não foi possível guardar o ficheiro.");
  try {
    const publicUrl = config.client.storage.from(config.bucket).getPublicUrl(objectPath).data.publicUrl;
    const media = await withClientCmsTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO lf_cms_media(project_id, object_path, filename, mime_type, size_bytes, alt_text)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, object_path, filename, mime_type, size_bytes, alt_text, created_at`,
        [projectId, objectPath, safeFilename, file.type, file.size, altText.trim().slice(0, 300) || null],
      );
      await client.query(
        `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
         VALUES ($1, $2, 'media.upload', 'media', $3)`,
        [projectId, actor.userId, result.rows[0].id],
      );
      return result.rows[0];
    });
    return { ...media, publicUrl };
  } catch (error) {
    await config.client.storage.from(config.bucket).remove([objectPath]);
    throw error;
  }
}

export async function listClientCmsMedia() {
  const actor = await requireClientCmsActor("media.read");
  const projectId = getActorInstallation(actor).projectId;
  const result = await getClientCmsPool().query(
    `SELECT id, object_path, filename, mime_type, size_bytes, alt_text, created_at
       FROM lf_cms_media WHERE project_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [projectId],
  );
  return result.rows;
}

export async function deleteClientCmsMedia(mediaId: string) {
  const actor = await requireClientCmsActor("media.write");
  const projectId = getActorInstallation(actor).projectId;
  const config = storageConfig();
  const db = getClientCmsPool();
  const found = await db.query(`SELECT object_path FROM lf_cms_media WHERE project_id = $1 AND id = $2`, [projectId, mediaId]);
  const objectPath = found.rows[0]?.object_path;
  if (!objectPath) throw new Error("Ficheiro não encontrado nesta instalação.");
  if (!String(objectPath).startsWith(`${projectId}/`)) throw new Error("O ficheiro não pertence a esta instalação.");
  const publicUrl = config.client.storage.from(config.bucket).getPublicUrl(String(objectPath)).data.publicUrl;
  const sections = await db.query(`SELECT content FROM lf_cms_sections WHERE project_id = $1`, [projectId]);
  if (sections.rows.some(({ content }) => containsValue(content, String(objectPath)) || containsValue(content, publicUrl))) {
    throw new Error("A imagem está a ser usada numa secção. Substitua-a antes de a eliminar.");
  }
  const removed = await config.client.storage.from(config.bucket).remove([String(objectPath)]);
  if (removed.error) throw new Error("Não foi possível remover o ficheiro do storage.");
  await withClientCmsTransaction(async (client) => {
    await client.query(`DELETE FROM lf_cms_media WHERE project_id = $1 AND id = $2`, [projectId, mediaId]);
    await client.query(
      `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
       VALUES ($1, $2, 'media.delete', 'media', $3)`,
      [projectId, actor.userId, mediaId],
    );
  });
}

function matchesImageSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (mimeType === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (mimeType === "image/avif") return String.fromCharCode(...bytes.slice(4, 12)).includes("ftyp") && String.fromCharCode(...bytes.slice(8, 12)).startsWith("avi");
  return false;
}

function containsValue(value: unknown, expected: string): boolean {
  if (value === expected) return true;
  if (Array.isArray(value)) return value.some((item) => containsValue(item, expected));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsValue(item, expected));
  return false;
}
