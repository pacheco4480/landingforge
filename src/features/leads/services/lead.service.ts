import { LeadStatus, Prisma } from "@/generated/prisma/client";
import type { LeadFilters } from "@/features/leads/schemas/lead.schema";
import { leadStatusOrder } from "@/features/leads/services/lead-status.service";
import {
  buildLeadWhere,
  getLeadStatusDates,
} from "@/features/leads/services/lead-query.service";
import { db } from "@/lib/db";

const pageSize = 50;

export async function getLeadsWorkspace(filters: LeadFilters) {
  const where = buildLeadWhere(filters);
  const orderBy: Prisma.LeadOrderByWithRelationInput =
    filters.sort === "name"
      ? { name: filters.direction }
      : filters.sort === "status"
        ? { status: filters.direction }
        : { createdAt: filters.direction };

  const [leads, forms, sources, selectedLead, auditLogs] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy,
      take: pageSize,
      include: {
        formSubmission: {
          include: {
            form: { select: { id: true, name: true, key: true } },
            page: { select: { id: true, title: true, slug: true } },
          },
        },
        _count: { select: { notes: true } },
      },
    }),
    db.form.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.lead.findMany({
      where: { deletedAt: null, source: { not: null } },
      distinct: ["source"],
      orderBy: { source: "asc" },
      select: { source: true },
    }),
    filters.leadId
      ? db.lead.findFirst({
          where: { id: filters.leadId, deletedAt: null },
          include: {
            notes: {
              orderBy: { createdAt: "desc" },
              include: { user: { select: { name: true, email: true } } },
            },
            formSubmission: {
              include: {
                form: { select: { id: true, name: true, key: true } },
                page: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    industry: { select: { name: true } },
                    template: { select: { name: true } },
                    templateVariant: { select: { name: true } },
                  },
                },
              },
            },
          },
        })
      : null,
    filters.leadId
      ? db.auditLog.findMany({
          where: {
            OR: [
              { entityType: "lead", entityId: filters.leadId },
              { entityType: "lead_note", newValues: { path: ["leadId"], equals: filters.leadId } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true, email: true } } },
        })
      : [],
  ]);

  const pipeline = leadStatusOrder.map((status) => ({
    status,
    leads: leads.filter((lead) => lead.status === status).slice(0, 12),
  }));

  return {
    leads,
    forms,
    sources: sources.map((item) => item.source).filter(Boolean),
    selectedLead,
    auditLogs,
    pipeline,
    limit: pageSize,
  };
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  userId: string,
) {
  return db.$transaction(async (tx) => {
    const current = await tx.lead.findFirstOrThrow({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
    const lead = await tx.lead.update({
      where: { id },
      data: { status, ...getLeadStatusDates(status) },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "lead.status.update",
        entityType: "lead",
        entityId: id,
        oldValues: { status: current.status },
        newValues: { status },
      },
    });
    return lead;
  });
}

export async function saveLeadNote(
  input: { id?: string; leadId: string; note: string },
  userId: string,
) {
  return db.$transaction(async (tx) => {
    await tx.lead.findFirstOrThrow({
      where: { id: input.leadId, deletedAt: null },
      select: { id: true },
    });
    const note = input.id
      ? await tx.leadNote.update({
          where: { id: input.id },
          data: { note: input.note, userId },
        })
      : await tx.leadNote.create({
          data: { leadId: input.leadId, note: input.note, userId },
        });
    await tx.auditLog.create({
      data: {
        userId,
        action: input.id ? "lead_note.update" : "lead_note.create",
        entityType: "lead_note",
        entityId: note.id,
        newValues: { leadId: input.leadId },
      },
    });
    return note;
  });
}

export async function deleteLeadNote(
  input: { id: string; leadId: string },
  userId: string,
) {
  return db.$transaction(async (tx) => {
    const note = await tx.leadNote.delete({
      where: { id: input.id, leadId: input.leadId },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "lead_note.delete",
        entityType: "lead_note",
        entityId: input.id,
        newValues: { leadId: input.leadId },
      },
    });
    return note;
  });
}
