"use client";

import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  FormInput,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  Palette,
  Target,
  ShieldCheck,
  FolderKanban,
  Search,
  Settings,
  Users,
} from "lucide-react";

import type { CmsNavigationIcon } from "@/features/cms/navigation/cms-navigation.config";

export const cmsNavigationIcons = {
  analytics: BarChart3,
  bell: Bell,
  content: Layers3,
  clients: Building2,
  dashboard: LayoutDashboard,
  forms: FormInput,
  media: ImageIcon,
  pages: FileText,
  projects: FolderKanban,
  prospects: Target,
  palette: Palette,
  search: Search,
  privacy: ShieldCheck,
  settings: Settings,
  users: Users,
} satisfies Record<
  CmsNavigationIcon,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
>;
