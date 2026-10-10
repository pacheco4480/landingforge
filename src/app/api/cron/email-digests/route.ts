import { NextRequest, NextResponse } from "next/server";

import { runDueDigestNotifications } from "@/features/email/services/digest-scheduler.service";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDueDigestNotifications();
  return NextResponse.json(result);
}
