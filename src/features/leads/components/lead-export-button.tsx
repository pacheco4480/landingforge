import { Download } from "lucide-react";

import type { LeadFilters } from "@/features/leads/schemas/lead.schema";

export function LeadExportButton({ filters }: { filters: LeadFilters }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "leadId") params.set(key, String(value));
  }

  return (
    <a
      className="border-border bg-background text-foreground hover:bg-muted inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors"
      href={`/leads/export?${params.toString()}`}
    >
      <Download className="size-4" aria-hidden="true" />
      Exportar CSV
    </a>
  );
}
