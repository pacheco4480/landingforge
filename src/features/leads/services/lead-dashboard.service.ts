import { LeadStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

export async function getLeadDashboardMetrics() {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, todayCount, weekCount, monthCount, converted, recent, activity] =
    await Promise.all([
      db.lead.count({ where: { deletedAt: null } }),
      db.lead.count({ where: { deletedAt: null, createdAt: { gte: today } } }),
      db.lead.count({ where: { deletedAt: null, createdAt: { gte: week } } }),
      db.lead.count({ where: { deletedAt: null, createdAt: { gte: month } } }),
      db.lead.count({
        where: { deletedAt: null, status: LeadStatus.CONVERTED },
      }),
      db.lead.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, source: true, createdAt: true },
      }),
      db.auditLog.findMany({
        where: { entityType: { in: ["lead", "lead_note"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

  return {
    total,
    today: todayCount,
    week: weekCount,
    month: monthCount,
    converted,
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    recent,
    activity,
  };
}
