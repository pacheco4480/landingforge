import { NextResponse } from "next/server";

import { exportPersonalData } from "@/features/legal/services/personal-data-export.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET(request: Request) {
  await requirePermission(permissions.leadsExport);
  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? "";
  const data = await exportPersonalData({ email });

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="personal-data-${Date.now()}.json"`,
    },
  });
}

export async function POST(request: Request) {
  await requirePermission(permissions.leadsExport);
  const formData = await request.formData();
  const email = formData.get("email");
  const data = await exportPersonalData({ email });

  return NextResponse.json(data);
}
