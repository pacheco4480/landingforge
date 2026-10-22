import { permissions } from "@/features/rbac/permissions";

export type CmsNavigationIcon =
  | "analytics"
  | "bell"
  | "content"
  | "dashboard"
  | "forms"
  | "media"
  | "pages"
  | "palette"
  | "search"
  | "settings"
  | "users";

export type CmsNavigationItem = {
  label: string;
  href: string;
  permission: string;
  icon: CmsNavigationIcon;
  description: string;
};

export const cmsNavigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    permission: permissions.dashboardRead,
    icon: "dashboard",
    description: "Overview, lead activity and quick actions.",
  },
  {
    label: "Pages",
    href: "/pages",
    permission: permissions.pagesRead,
    icon: "pages",
    description: "Landing pages and publishing structure.",
  },
  {
    label: "Content",
    href: "/content",
    permission: permissions.cmsRead,
    icon: "content",
    description: "Editable landing page sections and copy.",
  },
  {
    label: "Media",
    href: "/media",
    permission: permissions.mediaRead,
    icon: "media",
    description: "Images, documents and reusable assets.",
  },
  {
    label: "Forms",
    href: "/forms",
    permission: permissions.formsRead,
    icon: "forms",
    description: "Lead capture form foundations.",
  },
  {
    label: "Leads",
    href: "/leads",
    permission: permissions.leadsRead,
    icon: "users",
    description: "Captured leads and pipeline entry point.",
  },
  {
    label: "SEO",
    href: "/seo",
    permission: permissions.seoRead,
    icon: "search",
    description: "Metadata and search visibility foundations.",
  },
  {
    label: "Branding",
    href: "/branding",
    permission: permissions.settingsRead,
    icon: "palette",
    description: "Brand identity and theme configuration.",
  },
  {
    label: "Analytics",
    href: "/analytics",
    permission: permissions.dashboardRead,
    icon: "analytics",
    description: "Performance and conversion insights foundation.",
  },
  {
    label: "Settings",
    href: "/settings",
    permission: permissions.settingsRead,
    icon: "settings",
    description: "Site, account and integration settings.",
  },
  {
    label: "Admin",
    href: "/admin",
    permission: permissions.adminAccess,
    icon: "users",
    description: "Audit logs, backups and exports.",
  },
  {
    label: "Portfolio",
    href: "/portfolio/manage",
    permission: permissions.adminAccess,
    icon: "pages",
    description: "Approved public demos and screenshot visibility.",
  },
  {
    label: "Notifications",
    href: "/dashboard#notifications",
    permission: permissions.dashboardRead,
    icon: "bell",
    description: "Notification center foundation.",
  },
] satisfies CmsNavigationItem[];
