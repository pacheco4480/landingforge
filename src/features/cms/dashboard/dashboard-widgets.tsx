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

function formatDate(date: Date | null) {
  if (!date) return "No activity yet";
  return new Intl.DateTimeFormat("en", {
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
      <StatCard label="Total Leads" value={String(metrics.totalLeads)} />
      <StatCard label="Leads Today" value={String(metrics.leadsToday)} />
      <StatCard label="Leads This Week" value={String(metrics.leadsThisWeek)} />
      <StatCard
        label="Leads This Month"
        value={String(metrics.leadsThisMonth)}
      />
      <StatCard label="Total Pages" value={String(metrics.totalPages)} />
      <StatCard label="Last Update" value={formatDate(metrics.lastUpdatedAt)} />
      <Card>
        <p className="text-muted-foreground text-sm font-medium">
          System Status
        </p>
        <div className="mt-3">
          <Status tone="success">{metrics.systemStatus}</Status>
        </div>
      </Card>
      <StatCard
        label="Unread Notifications"
        value={String(metrics.unreadNotifications)}
      />
    </Grid>
  );
}

const quickActions = [
  {
    title: "Pages",
    description: "Prepare page management and publishing workflows.",
    href: "/pages",
    icon: FileText,
  },
  {
    title: "Leads",
    description: "Review captured leads and pipeline foundations.",
    href: "/leads",
    icon: Users,
  },
  {
    title: "Media",
    description: "Organize images and reusable landing page assets.",
    href: "/media",
    icon: ImageIcon,
  },
  {
    title: "SEO",
    description: "Prepare metadata and search visibility controls.",
    href: "/seo",
    icon: Search,
  },
] as const;

export function DashboardQuickActions() {
  return (
    <Grid className="md:grid-cols-2 xl:grid-cols-4">
      {quickActions.map((action) => {
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
    ["Lead Metrics", "Connected to live lead counts."],
    ["SEO Metrics", "Prepared for TASK 008."],
    ["Analytics", "Prepared for future conversion events."],
    ["Notifications", "Unread counter is connected."],
  ] as const;

  return (
    <Grid className="lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Widget Architecture</CardTitle>
          <CardDescription>
            Dashboard areas are ready for future modules without changing the
            shell.
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
          <CardTitle>Backup Status</CardTitle>
          <CardDescription>Estado operacional dos backups.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{backupSummary.totalBackups}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Falhados</span>
            <span className="font-semibold">{backupSummary.failedBackups}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Ultimo</span>
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
          <CardTitle>Deployment</CardTitle>
          <CardDescription>Estado de entrega do projeto.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 text-sm">
          <div className="flex items-start gap-3">
            <Globe2 className="text-primary mt-0.5 size-4" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                {deploymentSummary.cmsEnabled ? "Landing + CMS" : "Landing Only"}
              </p>
              <p className="text-muted-foreground">
                {deploymentSummary.domain ?? "Domínio não configurado"}
              </p>
            </div>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Checklist</span>
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
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Ultimas acoes auditadas.</CardDescription>
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
