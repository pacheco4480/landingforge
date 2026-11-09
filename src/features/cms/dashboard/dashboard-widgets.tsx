import { FileText, Gauge, Globe2, ImageIcon, Search, Users } from "lucide-react";
import Link from "next/link";

import { Status } from "@/components/ui/feedback";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { StatCard } from "@/components/ui/data-display";
import { NotificationOverview } from "@/features/settings/components/notification-overview";
import { SecurityOverview } from "@/features/settings/components/security-overview";
import type { DashboardMetrics } from "@/features/cms/dashboard/dashboard.types";
import { permissions as permissionKeys } from "@/features/rbac/permissions";
import { hasPermission } from "@/features/rbac/rbac.service";

function formatDate(date: Date | null) {
  if (!date) return "Ainda sem atividade";
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DashboardMetricGrid({
  metrics,
}: {
  metrics: DashboardMetrics;
}) {
  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total de contactos" value={String(metrics.totalLeads)} helper="Contagem global de contactos não eliminados na plataforma, não limitada à lista visível ao teu perfil." />
      <StatCard label="Contactos de hoje" value={String(metrics.leadsToday)} helper="Contagem global de contactos não eliminados na plataforma, não limitada à lista visível ao teu perfil." />
      <StatCard label="Contactos desta semana" value={String(metrics.leadsThisWeek)} helper="Contagem global de contactos não eliminados na plataforma, não limitada à lista visível ao teu perfil." />
      <StatCard
        label="Contactos deste mês"
        value={String(metrics.leadsThisMonth)}
        helper="Contagem global de contactos não eliminados na plataforma, não limitada à lista visível ao teu perfil."
      />
      <StatCard label="Páginas na plataforma" value={String(metrics.totalPages)} helper="Total global de páginas não eliminadas, incluindo demonstrações; pode diferir das páginas visíveis na tua lista." />
      <StatCard label="Última atualização" value={formatDate(metrics.lastUpdatedAt)} />
      <Card>
        <p className="text-muted-foreground text-sm font-medium">
          Estado do sistema
        </p>
        <div className="mt-3">
          <Status tone={metrics.systemStatus === "Operational" ? "success" : "warning"}>
            {metrics.systemStatus === "Operational" ? "Operacional" : "Requer atenção"}
          </Status>
        </div>
      </Card>
      <StatCard
        label="Notificações por ler"
        value={String(metrics.unreadNotifications)}
      />
    </Grid>
  );
}

const quickActions = [
  {
    title: "Páginas",
    description: "Consulta e gere páginas e os respetivos estados.",
    href: "/pages",
    icon: FileText,
    permission: permissionKeys.pagesRead,
  },
  {
    title: "Contactos",
    description: "Consulta os contactos recebidos através dos formulários.",
    href: "/leads",
    icon: Users,
    permission: permissionKeys.leadsRead,
  },
  {
    title: "Multimédia",
    description: "Consulta imagens, documentos e recursos reutilizáveis.",
    href: "/media",
    icon: ImageIcon,
    permission: permissionKeys.mediaRead,
  },
  {
    title: "SEO",
    description: "Consulta metadados e visibilidade nos motores de pesquisa.",
    href: "/seo",
    icon: Search,
    permission: permissionKeys.seoRead,
  },
] as const;

export function getDashboardQuickActions(userPermissions: readonly string[]) {
  return quickActions.filter((action) => hasPermission(userPermissions, action.permission));
}

export function DashboardQuickActions({ userPermissions }: { userPermissions: readonly string[] }) {
  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-4">
      {getDashboardQuickActions(userPermissions).map((action) => {
        const Icon = action.icon;

        return (
          <Link
            className="border-border bg-surface-elevated hover:bg-muted rounded-md border p-5 shadow-sm transition-colors"
            href={action.href}
            key={action.href}
          >
            <Icon className="text-primary size-5" aria-hidden="true" />
            <h3 className="mt-4 font-semibold">{action.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {action.description}
            </p>
          </Link>
        );
      })}
    </Grid>
  );
}

export function DashboardFoundations({
  backupSummary,
  deploymentSummary,
  notificationOverview,
  recentAuditActivity,
  securitySummary,
}: {
  backupSummary: DashboardMetrics["backupSummary"];
  deploymentSummary: DashboardMetrics["deploymentSummary"];
  notificationOverview: DashboardMetrics["notificationOverview"];
  recentAuditActivity: DashboardMetrics["recentAuditActivity"];
  securitySummary: DashboardMetrics["securitySummary"];
}) {
  const foundations = [
    ["Métricas de contactos", "Ligadas às contagens atuais de contactos."],
    ["Métricas de SEO", "Preparadas para uma evolução futura."],
    ["Análise", "Preparada para futuros eventos de conversão."],
    ["Notificações", "A contagem de notificações por ler está activa."],
  ] as const;

  return (
    <Grid className="lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Estrutura do Dashboard</CardTitle>
          <CardDescription>
            As áreas do Dashboard permitem acrescentar módulos sem alterar a estrutura principal.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3">
          {foundations.map(([title, description]) => (
            <div className="flex items-start gap-3" key={title}>
              <Gauge
                className="text-primary mt-0.5 size-4"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Estado das cópias de segurança</CardTitle>
          <CardDescription>Estado operacional das cópias de segurança.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{backupSummary.totalBackups}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Com falhas</span>
            <span className="font-semibold">{backupSummary.failedBackups}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Última cópia</span>
            <span className="font-semibold">
              {backupSummary.lastBackup
                ? formatDate(backupSummary.lastBackup.createdAt)
                : "Sem backup"}
            </span>
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Disponibilização</CardTitle>
          <CardDescription>Estado de entrega do projeto.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 text-sm">
          <div className="flex items-start gap-3">
            <Globe2 className="text-primary mt-0.5 size-4" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                {deploymentSummary.cmsEnabled ? "Landing page com CMS" : "Apenas landing page"}
              </p>
              <p className="text-muted-foreground">
                {deploymentSummary.domain ?? "Domínio não configurado"}
              </p>
            </div>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Lista de verificação</span>
            <span className="font-semibold">
              {deploymentSummary.completedItems}/{deploymentSummary.totalItems}
            </span>
          </div>
          <Status
            tone={
              deploymentSummary.readyForDelivery &&
              deploymentSummary.readyComputed
                ? "success"
                : "warning"
            }
          >
            {deploymentSummary.readyForDelivery &&
            deploymentSummary.readyComputed
              ? "Pronto para entrega"
              : "A validar"}
          </Status>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Atividade recente</CardTitle>
          <CardDescription>Últimas ações registadas na auditoria.</CardDescription>
        </CardHeader>
        <div className="grid gap-3">
          {recentAuditActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem atividade registada.</p>
          ) : (
            recentAuditActivity.map((log) => (
              <div className="grid gap-1 text-sm" key={`${log.action}-${log.createdAt.toISOString()}`}>
                <p className="font-semibold">{log.action}</p>
                <p className="text-muted-foreground">
                  {log.entityType} - {log.user?.email ?? "Sistema"}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
      <NotificationOverview overview={notificationOverview} />
      <SecurityOverview summary={securitySummary} />
    </Grid>
  );
}
