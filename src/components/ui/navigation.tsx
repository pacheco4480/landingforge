import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

export function Navbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("border-border bg-background/95 border-b", className)}
      {...props}
    />
  );
}

export function Sidebar({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn("border-border bg-surface border-r px-4 py-6", className)}
      {...props}
    />
  );
}

export function Breadcrumb({
  items,
  className,
}: {
  items: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <nav className={className} aria-label="Breadcrumb">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li
            className="flex items-center gap-2"
            key={`${item.label}-${index}`}
          >
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link className="hover:text-foreground" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Tabs({
  tabs,
  activeValue,
  className,
}: {
  tabs: Array<{ value: string; label: string; href?: string }>;
  activeValue: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        const classes = cn(
          "rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        );

        return tab.href ? (
          <Link
            className={classes}
            href={tab.href}
            key={tab.value}
            role="tab"
            aria-selected={isActive}
          >
            {tab.label}
          </Link>
        ) : (
          <button
            className={classes}
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  className,
}: {
  currentPage: number;
  totalPages: number;
  className?: string;
}) {
  return (
    <nav className={className} aria-label="Pagination">
      <p className="text-muted-foreground text-sm">
        Page {currentPage} of {totalPages}
      </p>
    </nav>
  );
}
