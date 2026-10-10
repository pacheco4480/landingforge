import type { LeadStatus } from "@/generated/prisma/client";
import { leadStatusLabels } from "@/features/leads/services/lead-status.service";
import { cn } from "@/lib/utils";

const statusClasses: Record<LeadStatus, string> = {
  NEW: "border-info/30 text-info",
  CONTACTED: "border-primary/30 text-primary",
  IN_NEGOTIATION: "border-warning/30 text-warning",
  CONVERTED: "border-success/30 text-success",
  LOST: "border-error/30 text-error",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusClasses[status],
      )}
    >
      {leadStatusLabels[status]}
    </span>
  );
}
