"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { CmsNavigationItem } from "@/features/cms/navigation/cms-navigation.config";
import { cmsNavigationIcons } from "@/features/cms/navigation/cms-navigation-icons";
import { cn } from "@/lib/utils";

export function CmsSidebar({ items }: { items: CmsNavigationItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-surface hidden min-h-screen w-72 border-r px-4 py-5 lg:block">
      <div className="px-2">
        <p className="text-lg font-bold">LandingForge</p>
        <p className="text-muted-foreground mt-1 text-sm">CMS</p>
      </div>
      <nav className="mt-8 grid gap-1" aria-label="CMS navigation">
        {items
          .filter((item) => item.label !== "Notifications")
          .map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = cmsNavigationIcons[item.icon];

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
