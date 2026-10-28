import { db } from "@/lib/db";

export async function purgeExpiredClientPackageExports(now = new Date()) {
  return db.clientPackageExport.deleteMany({ where: { expiresAt: { lte: now } } });
}
