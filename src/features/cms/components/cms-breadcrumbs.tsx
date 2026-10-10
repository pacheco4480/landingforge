"use client";

import { usePathname } from "next/navigation";

import { Breadcrumb } from "@/components/ui/navigation";
import { getBreadcrumbs } from "@/features/cms/navigation/cms-navigation";

export function CmsBreadcrumbs() {
  const pathname = usePathname();

  return <Breadcrumb items={getBreadcrumbs(pathname)} />;
}
