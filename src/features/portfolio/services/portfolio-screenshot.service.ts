import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { createSupabaseStorageClient } from "@/lib/storage/supabase-storage";
import { portfolioScreenshotIdSchema, portfolioScreenshotSchema } from "@/features/portfolio/schemas/portfolio.schema";
import { canPublishPortfolioScreenshot } from "@/features/portfolio/policies/public-portfolio.policy";
import { validateMediaFile } from "@/features/media/schemas/media.schema";
import { assertRateLimit } from "@/lib/security/rate-limiter";

function privateBucketName() {
  const name = process.env.SUPABASE_PORTFOLIO_PRIVATE_BUCKET?.trim();
  if (!name) throw new Error("Configura SUPABASE_PORTFOLIO_PRIVATE_BUCKET para guardar capturas internas.");
  return name;
}

async function privateStorage() {
  const client = createSupabaseStorageClient();
  const bucket = privateBucketName();
  const { data, error } = await client.storage.getBucket(bucket);
  if (error || data.public) throw new Error("O bucket de capturas tem de existir e ser privado.");
  return { client, bucket };
}

export async function listScreenshotAssets() {
  return db.mediaAsset.findMany({ where: { deletedAt: null, mimeType: { startsWith: "image/" }, publicUrl: { not: null } }, orderBy: { createdAt: "desc" }, take: 80, select: { id: true, filename: true, publicUrl: true, altText: true } });
}

export async function createPortfolioScreenshot(formData: FormData, userId: string) {
  await assertRateLimit({ action: "media-upload", key: `portfolio-screenshot:${userId}` });
  const parsed = portfolioScreenshotSchema.parse({
    pageId: formData.get("pageId"), mediaAssetId: formData.get("mediaAssetId") ?? "",
    category: formData.get("category"), viewport: formData.get("viewport"),
    sourceRoute: formData.get("sourceRoute"), consentState: formData.get("consentState"),
    contentOrigin: formData.get("contentOrigin"), altText: formData.get("altText"),
    isPublic: formData.has("isPublic"), sortOrder: formData.get("sortOrder") || 0,
    capturedAt: formData.get("capturedAt") || "",
  });
  const page = await db.page.findFirst({ where: { id: parsed.pageId, isDemo: true, deletedAt: null }, select: { id: true, slug: true } });
  if (!page) throw new Error("Seleciona uma demo válida.");
  if (parsed.sourceRoute !== `/${page.slug}` && !parsed.sourceRoute.startsWith(`/${page.slug}#`)) throw new Error("A rota da captura tem de pertencer à demo selecionada.");
  if (parsed.isPublic && ["cms", "dashboard"].includes(parsed.category)) throw new Error("Capturas de CMS e Dashboard são sempre internas.");
  if (parsed.isPublic && parsed.consentState === "rejected") throw new Error("Uma captura sem consentimento não pode ser publicada.");

  const file = formData.get("file");
  const mediaAssetId: string | null = parsed.mediaAssetId || null;
  let privateStoragePath: string | null = null;
  if (parsed.category === "cms" || parsed.category === "dashboard") {
    if (!(file instanceof File) || file.size === 0) throw new Error("Carrega o ficheiro para a área privada.");
    validateMediaFile(file, 10);
    privateStoragePath = `screenshots/${page.id}/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { client, bucket } = await privateStorage();
    const { error } = await client.storage.from(bucket).upload(privateStoragePath, file, { contentType: file.type, upsert: false });
    if (error) throw new Error("Não foi possível guardar a captura privada.");
  } else {
    if (!mediaAssetId) throw new Error("Seleciona uma imagem da Media Library.");
    const asset = await db.mediaAsset.findFirst({ where: { id: mediaAssetId, deletedAt: null, mimeType: { startsWith: "image/" }, publicUrl: { not: null } }, select: { id: true } });
    if (!asset) throw new Error("A imagem selecionada não está disponível.");
  }

  try {
    return await db.$transaction(async (tx) => {
      const screenshot = await tx.portfolioScreenshot.create({ data: {
        pageId: page.id, mediaAssetId, privateStoragePath,
        category: parsed.category, viewport: parsed.viewport, sourceRoute: parsed.sourceRoute,
        consentState: parsed.consentState, contentOrigin: parsed.contentOrigin,
        altText: parsed.altText, isPublic: parsed.isPublic,
        sortOrder: parsed.sortOrder, capturedAt: parsed.capturedAt ? new Date(parsed.capturedAt) : new Date(),
      } });
      await tx.auditLog.create({ data: { userId, action: "portfolio.screenshot.create", entityType: "portfolio_screenshot", entityId: screenshot.id, newValues: { pageId: page.id, category: parsed.category, isPublic: parsed.isPublic } } });
      return screenshot;
    });
  } catch (error) {
    if (privateStoragePath) {
      const { client, bucket } = await privateStorage();
      await client.storage.from(bucket).remove([privateStoragePath]);
    }
    throw error;
  }
}

export async function updatePortfolioScreenshotVisibility(input: unknown, userId: string) {
  const data = portfolioScreenshotIdSchema.extend({ isPublic: portfolioScreenshotSchema.shape.isPublic }).parse(input);
  const screenshot = await db.portfolioScreenshot.findFirst({ where: { id: data.id, deletedAt: null }, include: { mediaAsset: true, page: { select: { status: true, demoStatus: true, portfolioVisible: true } } } });
  if (!screenshot) throw new Error("Captura não encontrada.");
  const hasPublicAsset = Boolean(screenshot.mediaAsset?.publicUrl && !screenshot.mediaAsset.deletedAt);
  if (data.isPublic && !canPublishPortfolioScreenshot({
    category: screenshot.category,
    consentState: screenshot.consentState,
    hasPublicAsset,
    portfolioVisible: screenshot.page.portfolioVisible,
    pageStatus: screenshot.page.status,
    demoStatus: screenshot.page.demoStatus,
  })) {
    throw new Error("Esta captura não cumpre os requisitos de publicação.");
  }
  await db.$transaction([
    db.portfolioScreenshot.update({ where: { id: data.id }, data: { isPublic: data.isPublic } }),
    db.auditLog.create({ data: { userId, action: data.isPublic ? "portfolio.screenshot.publish" : "portfolio.screenshot.hide", entityType: "portfolio_screenshot", entityId: data.id, newValues: { isPublic: data.isPublic } } }),
  ]);
}

export async function archivePortfolioScreenshot(idInput: unknown, userId: string) {
  const { id } = portfolioScreenshotIdSchema.parse({ id: idInput });
  const screenshot = await db.portfolioScreenshot.update({ where: { id }, data: { isPublic: false, deletedAt: new Date() } });
  if (screenshot.privateStoragePath) {
    const { client, bucket } = await privateStorage();
    await client.storage.from(bucket).remove([screenshot.privateStoragePath]);
  }
  await db.auditLog.create({ data: { userId, action: "portfolio.screenshot.archive", entityType: "portfolio_screenshot", entityId: id } });
}

export async function createInternalScreenshotUrl(idInput: unknown) {
  const { id } = portfolioScreenshotIdSchema.parse({ id: idInput });
  const screenshot = await db.portfolioScreenshot.findFirst({ where: { id, deletedAt: null, isPublic: false, privateStoragePath: { not: null } }, select: { privateStoragePath: true } });
  if (!screenshot?.privateStoragePath) return null;
  const { client, bucket } = await privateStorage();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(screenshot.privateStoragePath, 60);
  if (error) return null;
  return data.signedUrl;
}
