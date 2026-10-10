import { LeadStatus, Prisma } from "@/generated/prisma/client";
import type { LeadFilters } from "@/features/leads/schemas/lead.schema";

export function getLeadDateBoundary(date: LeadFilters["date"]) {
  const now = new Date();
  if (date === "today") return startOfDay(now);
  if (date === "week") return startOfWeek(now);
  if (date === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

export function buildLeadWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = { deletedAt: null };
  const boundary = getLeadDateBoundary(filters.date);
  if (boundary) where.createdAt = { gte: boundary };
  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = { contains: filters.source };
  if (filters.formId) {
    where.formSubmission = { formId: filters.formId };
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
      { phone: { contains: filters.search } },
      { company: { contains: filters.search } },
    ];
  }
  return where;
}

export function getLeadStatusDates(status: LeadStatus) {
  return {
    lastContactedAt:
      status === LeadStatus.CONTACTED || status === LeadStatus.IN_NEGOTIATION
        ? new Date()
        : undefined,
    convertedAt: status === LeadStatus.CONVERTED ? new Date() : null,
    lostAt: status === LeadStatus.LOST ? new Date() : null,
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}
