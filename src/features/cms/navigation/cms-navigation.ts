import { cmsNavigationItems } from "@/features/cms/navigation/cms-navigation.config";
import type { CmsNavigationItem } from "@/features/cms/navigation/cms-navigation.config";
import { hasPermission } from "@/features/rbac/rbac.service";

export function getAuthorizedNavigation(
  userPermissions: readonly string[],
): CmsNavigationItem[] {
  return cmsNavigationItems.filter((item) =>
    hasPermission(userPermissions, item.permission),
  );
}

export function getBreadcrumbs(pathname: string) {
  const normalizedPathname = pathname.split("?")[0] || "/dashboard";
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }];

  const item = cmsNavigationItems.find((navigationItem) =>
    normalizedPathname.startsWith(navigationItem.href),
  );

  if (item && item.href !== "/dashboard") {
    crumbs.push({ label: item.label, href: item.href });
  }

  return crumbs;
}
