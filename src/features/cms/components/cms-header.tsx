import type { User } from "next-auth";

import { CmsBreadcrumbs } from "@/features/cms/components/cms-breadcrumbs";
import { CmsMobileNavigation } from "@/features/cms/components/cms-mobile-navigation";
import { GlobalSearch } from "@/features/cms/components/global-search";
import { NotificationButton } from "@/features/cms/components/notification-button";
import { UserMenu } from "@/features/cms/components/user-menu";
import type { CmsNavigationItem } from "@/features/cms/navigation/cms-navigation.config";

export function CmsHeader({
  user,
  items,
  unreadNotifications,
}: {
  user: User;
  items: CmsNavigationItem[];
  unreadNotifications: number;
}) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <CmsMobileNavigation items={items} />
          <div>
            <p className="text-sm font-bold lg:hidden">LandingForge CMS</p>
            <div className="hidden lg:block">
              <CmsBreadcrumbs />
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <GlobalSearch />
          <NotificationButton unreadCount={unreadNotifications} />
          <UserMenu
            email={user.email ?? "user@landingforge.local"}
            name={user.name ?? user.email ?? "User"}
            roles={user.roles}
          />
        </div>
      </div>
    </header>
  );
}
