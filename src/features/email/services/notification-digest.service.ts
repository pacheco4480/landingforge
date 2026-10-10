import {
  EmailDeliveryStatus,
  EmailDigestFrequency,
  EmailType,
  LeadStatus,
} from "@/generated/prisma/client";
import {
  getEmailBranding,
  sendEmail,
} from "@/features/email/services/email-provider.service";
import { renderDigestEmail } from "@/features/email/services/email-template.service";
import { db } from "@/lib/db";

export async function buildDigestMetrics(frequency: EmailDigestFrequency) {
  const { start, label } = getDigestWindow(frequency);

  const [total, newLeads, contacted, inNegotiation, converted, lost, recentLeads] =
    await Promise.all([
      db.lead.count({ where: { deletedAt: null, createdAt: { gte: start } } }),
      db.lead.count({
        where: {
          deletedAt: null,
          status: LeadStatus.NEW,
          createdAt: { gte: start },
        },
      }),
      db.lead.count({
        where: {
          deletedAt: null,
          status: LeadStatus.CONTACTED,
          updatedAt: { gte: start },
        },
      }),
      db.lead.count({
        where: {
          deletedAt: null,
          status: LeadStatus.IN_NEGOTIATION,
          updatedAt: { gte: start },
        },
      }),
      db.lead.count({
        where: {
          deletedAt: null,
          status: LeadStatus.CONVERTED,
          updatedAt: { gte: start },
        },
      }),
      db.lead.count({
        where: {
          deletedAt: null,
          status: LeadStatus.LOST,
          updatedAt: { gte: start },
        },
      }),
      db.lead.findMany({
        where: { deletedAt: null, createdAt: { gte: start } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          name: true,
          email: true,
          source: true,
          createdAt: true,
        },
      }),
    ]);

  return {
    periodStart: start,
    metrics: {
      periodLabel: label,
      total,
      newLeads,
      contacted,
      inNegotiation,
      converted,
      lost,
      recentLeads: recentLeads.map((lead) => ({
        name: lead.name ?? "Sem nome",
        email: lead.email ?? "Sem email",
        source: lead.source ?? "Landing page",
        createdAt: lead.createdAt,
      })),
    },
  };
}

export async function sendNotificationDigest(input: {
  recipient: string;
  frequency: EmailDigestFrequency;
}) {
  const { metrics, periodStart } = await buildDigestMetrics(input.frequency);
  const hasRelevantActivity =
    metrics.total +
      metrics.contacted +
      metrics.inNegotiation +
      metrics.converted +
      metrics.lost >
    0;

  if (!hasRelevantActivity) {
    return { sent: false, skipped: "empty" as const };
  }

  const branding = await getEmailBranding();
  const email = renderDigestEmail({ branding, metrics });
  const result = await sendEmail({
    type: EmailType.NOTIFICATION_DIGEST,
    to: input.recipient,
    ...email,
    metadata: {
      frequency: input.frequency,
      periodStart: periodStart.toISOString(),
      total: metrics.total,
    },
  });

  return {
    sent: result.sent,
    status: result.sent ? EmailDeliveryStatus.SENT : EmailDeliveryStatus.FAILED,
    logId: result.logId,
  };
}

export function getDigestWindow(frequency: EmailDigestFrequency) {
  const now = new Date();
  if (frequency === EmailDigestFrequency.DAILY) {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      label: "Hoje",
    };
  }
  if (frequency === EmailDigestFrequency.WEEKLY) {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return {
      start: new Date(now.getFullYear(), now.getMonth(), diff),
      label: "Esta semana",
    };
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    label: "Este mês",
  };
}
