import { isInternalDemoModeEnabled } from "@/config/deployment";
import { hasRole } from "@/features/rbac/rbac.service";

export type ContentMode = {
  internalDemoModeEnabled: boolean;
  canUseDemoMode: boolean;
  pageFilter: {
    isDemo: boolean;
  };
};

export function getContentMode(userRoles: readonly string[]): ContentMode {
  const internalDemoModeEnabled = isInternalDemoModeEnabled();
  const canUseDemoMode =
    internalDemoModeEnabled && hasRole(userRoles, "super_admin");

  return {
    internalDemoModeEnabled,
    canUseDemoMode,
    pageFilter: { isDemo: canUseDemoMode },
  };
}

export function canEditContent(userPermissions: readonly string[]) {
  return (
    userPermissions.includes("cms.write") ||
    userPermissions.includes("pages.write")
  );
}
