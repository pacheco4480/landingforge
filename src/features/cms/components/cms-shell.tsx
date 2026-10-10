import type { User } from "next-auth";

import { SkipLink } from "@/components/ui/skip-link";
import { CmsFooter } from "@/features/cms/components/cms-footer";
import { CmsHeader } from "@/features/cms/components/cms-header";
import { CmsSidebar } from "@/features/cms/components/cms-sidebar";
import { getAuthorizedNavigation } from "@/features/cms/navigation/cms-navigation";
import { db } from "@/lib/db";

export async function CmsShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const items = getAuthorizedNavigation(user.permissions);
  const unreadNotifications = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden lg:flex">
      <SkipLink />
      <CmsSidebar items={items} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <CmsHeader
          user={user}
          items={items}
          unreadNotifications={unreadNotifications}
        />
        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8"
          tabIndex={-1}
        >
          {children}
        </main>
        <CmsFooter />
      </div>
    </div>
  );
}
