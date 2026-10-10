"use client";

import * as React from "react";
import type { LeadStatus } from "@/generated/prisma/client";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useToast } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge";
import {
  getNextLeadStatus,
  getPreviousLeadStatus,
  leadStatusLabels,
} from "@/features/leads/services/lead-status.service";

type PipelineLead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: string | null;
};

export function LeadKanbanBoard({
  columns,
  canWrite,
  updateAction,
}: {
  columns: Array<{ status: LeadStatus; leads: PipelineLead[] }>;
  canWrite: boolean;
  updateAction: (formData: FormData) => Promise<void>;
}) {
  const { showToast, updateToast } = useToast();
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function moveLead(id: string, status: LeadStatus) {
    const toastId = showToast({
      tone: "loading",
      title: "A mover lead...",
    });
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);
    startTransition(async () => {
      try {
        await updateAction(formData);
        updateToast(toastId, { tone: "success", title: "Lead movido." });
      } catch {
        updateToast(toastId, {
          tone: "error",
          title: "Não foi possível mover o lead.",
        });
      }
    });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-5" aria-label="Pipeline">
      {columns.map((column) => (
        <div
          className="border-border bg-surface-elevated min-h-72 rounded-md border p-4"
          key={column.status}
          onDragOver={(event) => {
            if (canWrite) event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (canWrite && draggedLeadId) moveLead(draggedLeadId, column.status);
            setDraggedLeadId(null);
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <LeadStatusBadge status={column.status} />
            <span className="text-muted-foreground text-sm">
              {column.leads.length}
            </span>
          </div>
          <div className="grid gap-3">
            {column.leads.length === 0 ? (
              <p className="text-muted-foreground border-border rounded-md border border-dashed p-4 text-sm">
                Sem leads em {leadStatusLabels[column.status].toLowerCase()}.
              </p>
            ) : null}
            {column.leads.map((lead) => (
              <article
                className="border-border bg-background rounded-md border p-3 shadow-sm"
                draggable={canWrite}
                key={lead.id}
                onDragStart={() => setDraggedLeadId(lead.id)}
              >
                <a className="font-medium" href={`/leads?leadId=${lead.id}`}>
                  {lead.name ?? "Sem nome"}
                </a>
                <p className="text-muted-foreground mt-1 text-xs">
                  {[lead.email, lead.phone, lead.source]
                    .filter(Boolean)
                    .join(" · ") || "Sem dados adicionais"}
                </p>
                {canWrite ? (
                  <div className="mt-3 flex gap-2">
                    <MoveButton
                      leadId={lead.id}
                      label="Mover para trás"
                      status={getPreviousLeadStatus(lead.status)}
                      onMove={moveLead}
                      disabled={isPending}
                      icon="previous"
                    />
                    <MoveButton
                      leadId={lead.id}
                      label="Mover para a frente"
                      status={getNextLeadStatus(lead.status)}
                      onMove={moveLead}
                      disabled={isPending}
                      icon="next"
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function MoveButton({
  leadId,
  label,
  status,
  onMove,
  disabled,
  icon,
}: {
  leadId: string;
  label: string;
  status: LeadStatus | null;
  onMove: (id: string, status: LeadStatus) => void;
  disabled: boolean;
  icon: "previous" | "next";
}) {
  const Icon = icon === "previous" ? ArrowLeft : ArrowRight;
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-label={label}
      title={label}
      disabled={!status || disabled}
      onClick={() => {
        if (status) onMove(leadId, status);
      }}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  );
}
