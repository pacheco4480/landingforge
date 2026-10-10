"use client";

import {
  BarChart3,
  Bell,
  FileText,
  FormInput,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  Palette,
  Search,
  Settings,
  Users,
} from "lucide-react";

import type { CmsNavigationIcon } from "@/features/cms/navigation/cms-navigation.config";

export const cmsNavigationIcons = {
  analytics: BarChart3,
  bell: Bell,
  content: Layers3,
  dashboard: LayoutDashboard,
  forms: FormInput,
  media: ImageIcon,
  pages: FileText,
  palette: Palette,
  search: Search,
  settings: Settings,
  users: Users,
} satisfies Record<
  CmsNavigationIcon,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
>;
