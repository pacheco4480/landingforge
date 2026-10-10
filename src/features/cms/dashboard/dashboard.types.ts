import type {
  EmailDeliveryStatus,
  EmailDigestFrequency,
} from "@/generated/prisma/client";

export type DashboardMetrics = {
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  totalPages: number;
  lastUpdatedAt: Date | null;
  systemStatus: "Operational" | "Needs attention";
  unreadNotifications: number;
  notificationOverview: {
    frequency: EmailDigestFrequency;
    lastSentAt: Date | null;
    lastStatus: EmailDeliveryStatus | null;
    nextRunAt: Date | null;
  };
  securitySummary: {
    blocked: number;
    rateLimited: number;
    spam: number;
    turnstileFailed: number;
  };
  backupSummary: {
    failedBackups: number;
    lastBackup: {
      status: string;
      createdAt: Date;
      completedAt: Date | null;
    } | null;
    totalBackups: number;
  };
  deploymentSummary: {
    cmsEnabled: boolean;
    mode: string;
    environment: string;
    deploymentStatus: string;
    domain: string | null;
    domainStatus: string;
    sslStatus: string;
    readyForDelivery: boolean;
    completedItems: number;
    totalItems: number;
    readyComputed: boolean;
  };
  recentAuditActivity: Array<{
    action: string;
    entityType: string;
    createdAt: Date;
    user: { name: string; email: string } | null;
  }>;
};
