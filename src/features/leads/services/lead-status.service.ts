import type { LeadStatus } from "@/generated/prisma/client";

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contactado",
  IN_NEGOTIATION: "Em negociação",
  CONVERTED: "Convertido",
  LOST: "Perdido",
};

export const leadStatusOrder = [
  "NEW",
  "CONTACTED",
  "IN_NEGOTIATION",
  "CONVERTED",
  "LOST",
] as const satisfies readonly LeadStatus[];

export function getNextLeadStatus(status: LeadStatus) {
  const index = leadStatusOrder.indexOf(status);
  return leadStatusOrder[index + 1] ?? null;
}

export function getPreviousLeadStatus(status: LeadStatus) {
  const index = leadStatusOrder.indexOf(status);
  return leadStatusOrder[index - 1] ?? null;
}
