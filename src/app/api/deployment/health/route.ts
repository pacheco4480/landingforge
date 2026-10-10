import { NextResponse } from "next/server";

import { getDeploymentSummary } from "@/features/deployment/services/deployment.service";
import {
  SystemLogLevel,
  SystemLogSource,
} from "@/generated/prisma/client";
import { logMonitoringEvent } from "@/features/monitoring/services/logger.service";

export async function GET() {
  try {
    const summary = await getDeploymentSummary();

    return NextResponse.json(
      {
        status: summary.readyComputed ? "ready" : "needs_configuration",
        cmsEnabled: summary.cmsEnabled,
        mode: summary.mode,
        environment: summary.environment,
        deploymentStatus: summary.deploymentStatus,
        domainStatus: summary.domainStatus,
        sslStatus: summary.sslStatus,
        readyForDelivery: summary.readyForDelivery,
        checklist: {
          completed: summary.completedItems,
          total: summary.totalItems,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    await logMonitoringEvent({
      level: SystemLogLevel.CRITICAL,
      source: SystemLogSource.API,
      error,
      path: "/api/deployment/health",
      action: "deployment.health",
    });
    return NextResponse.json(
      { status: "error", message: "Health check indisponível." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
