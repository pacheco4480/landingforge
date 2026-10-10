import { db } from "@/lib/db";

export async function getSecuritySettings() {
  const current = await db.securitySetting.findFirst();
  if (current) return current;
  return db.securitySetting.create({ data: {} });
}
