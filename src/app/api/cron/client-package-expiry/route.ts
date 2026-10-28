import { NextRequest, NextResponse } from "next/server";

import { purgeExpiredClientPackageExports } from "@/features/exports/services/client-package-export-retention";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await purgeExpiredClientPackageExports();
  return NextResponse.json({ expiredExportsDeleted: result.count });
}
