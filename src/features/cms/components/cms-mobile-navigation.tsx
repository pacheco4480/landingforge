"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useRef } from "react";
import { usePathname } from "next/navigation";

import type { CmsNavigationItem } from "@/features/cms/navigation/cms-navigation.config";
import { cmsNavigationIcons } from "@/features/cms/navigation/cms-navigation-icons";
import { cn } from "@/lib/utils";

export function CmsMobileNavigation({ items }: { items: CmsNavigationItem[] }) {
  const pathname = usePathname();
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  return (
    <details
      className="group lg:hidden"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !disclosureRef.current?.open) return;
        event.preventDefault();
        disclosureRef.current.open = false;
        summaryRef.current?.focus();
      }}
      ref={disclosureRef}
    >
      <summary
        aria-label="Abrir ou fechar a navegação do CMS"
        className="border-border bg-background text-foreground focus-visible:outline-ring inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-md border transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        ref={summaryRef}
      >
        <Menu className="size-4" aria-hidden="true" />
      </summary>
      <div className="border-border bg-background absolute inset-x-4 top-16 z-40 rounded-md border p-3 shadow-xl">
        <nav className="grid gap-1" aria-label="Navegação móvel do CMS">
          {items
            .filter((item) => item.href !== "/dashboard#notifications")
            .map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = cmsNavigationIcons[item.icon];

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => {
                    if (disclosureRef.current) disclosureRef.current.open = false;
                  }}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </div>
    </details>
  );
}
