import { z } from "zod";

export const allowedMediaTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
] as const;

export const folderSchema = z.object({
  id: z.string().uuid().optional(),
  parentId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(80),
});

export const mediaMetadataSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().trim().min(1).max(160),
  altText: z.string().trim().max(180).optional().or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  folderId: z.string().uuid().optional().or(z.literal("")),
});

export function validateMediaFile(file: File, maxUploadMb: number) {
  if (
    !allowedMediaTypes.includes(file.type as (typeof allowedMediaTypes)[number])
  ) {
    throw new Error("Unsupported file type.");
  }

  if (file.size > maxUploadMb * 1024 * 1024) {
    throw new Error(`File exceeds the ${maxUploadMb}MB upload limit.`);
  }
}
