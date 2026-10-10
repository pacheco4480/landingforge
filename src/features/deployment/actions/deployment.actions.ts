"use server";

import { revalidatePath } from "next/cache";

import { permissions } from "@/features/rbac/permissions";
import { updateDeploymentSettings } from "@/features/deployment/services/deployment.service";
import { requirePermission } from "@/lib/auth/require-permission";

export async function updateDeploymentSettingsAction(formData: FormData) {
  const user = await requirePermission(permissions.settingsWrite);

  await updateDeploymentSettings(
    {
      deploymentMode: formData.get("deploymentMode"),
      deploymentEnvironment: formData.get("deploymentEnvironment"),
      deploymentStatus: formData.get("deploymentStatus"),
      domain: formData.get("domain"),
      domainStatus: formData.get("domainStatus"),
      sslStatus: formData.get("sslStatus"),
      readyForDelivery: formData.get("readyForDelivery") === "on",
    },
    user.id,
  );

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
