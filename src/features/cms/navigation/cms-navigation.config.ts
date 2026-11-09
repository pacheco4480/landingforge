import { permissions } from "@/features/rbac/permissions";

export type CmsNavigationIcon =
  | "analytics"
  | "bell"
  | "content"
  | "clients"
  | "dashboard"
  | "forms"
  | "media"
  | "pages"
  | "projects"
  | "prospects"
  | "palette"
  | "search"
  | "privacy"
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
    label: "Painel",
    href: "/dashboard",
    permission: permissions.dashboardRead,
    icon: "dashboard",
    description: "Resumo, atividade de contactos e acessos rápidos.",
  },
  {
    label: "Páginas",
    href: "/pages",
    permission: permissions.pagesRead,
    icon: "pages",
    description: "Landing pages e respetivos estados de publicação.",
  },
  {
    label: "Conteúdo",
    href: "/content",
    permission: permissions.cmsRead,
    icon: "content",
    description: "Secções e textos editáveis das landing pages.",
  },
  {
    label: "Multimédia",
    href: "/media",
    permission: permissions.mediaRead,
    icon: "media",
    description: "Imagens, documentos e recursos reutilizáveis.",
  },
  {
    label: "Formulários",
    href: "/forms",
    permission: permissions.formsRead,
    icon: "forms",
    description: "Formulários de captação de contactos.",
  },
  {
    label: "Contactos",
    href: "/leads",
    permission: permissions.leadsRead,
    icon: "users",
    description: "Contactos recebidos e ponto de entrada do acompanhamento.",
  },
  {
    label: "Clientes",
    href: "/clients",
    permission: permissions.clientsRead,
    icon: "clients",
    description: "Registos internos de clientes e estado da relação comercial.",
  },
  {
    label: "Projetos",
    href: "/projects",
    permission: permissions.projectsRead,
    icon: "projects",
    description: "Âmbito de entrega, responsáveis e definições de manutenção.",
  },
  {
    label: "Prospecção",
    href: "/prospects",
    permission: permissions.prospectsRead,
    icon: "prospects",
    description: "Prospecção B2B manual e preparação de contactos individuais.",
  },
  {
    label: "SEO",
    href: "/seo",
    permission: permissions.seoRead,
    icon: "search",
    description: "Metadados e visibilidade nos motores de pesquisa.",
  },
  {
    label: "Identidade da marca",
    href: "/branding",
    permission: permissions.settingsRead,
    icon: "palette",
    description: "Identidade da marca e configuração de temas.",
  },
  {
    label: "Análise",
    href: "/analytics",
    permission: permissions.dashboardRead,
    icon: "analytics",
    description: "Indicadores de desempenho e conversão.",
  },
  {
    label: "Definições",
    href: "/settings",
    permission: permissions.settingsRead,
    icon: "settings",
    description: "Definições do site, da conta e das integrações.",
  },
  {
    label: "Administração",
    href: "/admin",
    permission: permissions.adminAccess,
    icon: "users",
    description: "Registos de auditoria, cópias de segurança e exportações.",
  },
  {
    label: "Privacidade",
    href: "/privacy",
    permission: permissions.adminAccess,
    icon: "privacy",
    description: "Pedidos de titulares e revisão de retenção de dados.",
  },
  {
    label: "Portefólio",
    href: "/portfolio/manage",
    permission: permissions.adminAccess,
    icon: "pages",
    description: "Demonstrações públicas aprovadas e visibilidade das capturas.",
  },
  {
    label: "Notificações",
    href: "/dashboard#notifications",
    permission: permissions.dashboardRead,
    icon: "bell",
    description: "Centro de notificações.",
  },
] satisfies CmsNavigationItem[];
