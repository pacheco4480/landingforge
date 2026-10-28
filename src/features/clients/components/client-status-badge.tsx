import { Badge } from "@/components/ui/feedback";
import { ClientStatus } from "@/generated/prisma/client";

const labels: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "Contacto inicial",
  [ClientStatus.QUALIFIED]: "Qualificado",
  [ClientStatus.PROPOSAL_SENT]: "Proposta enviada",
  [ClientStatus.NEGOTIATION]: "Em negociação",
  [ClientStatus.APPROVED]: "Aprovado",
  [ClientStatus.IN_PROGRESS]: "Em curso",
  [ClientStatus.REVIEW]: "Em revisão",
  [ClientStatus.DELIVERED]: "Entregue",
  [ClientStatus.MAINTENANCE]: "Manutenção",
  [ClientStatus.ARCHIVED]: "Arquivado",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const tone =
    status === ClientStatus.ARCHIVED
      ? "neutral"
      : status === ClientStatus.DELIVERED || status === ClientStatus.MAINTENANCE
        ? "success"
        : status === ClientStatus.NEGOTIATION || status === ClientStatus.REVIEW
          ? "warning"
          : "info";
  return <Badge tone={tone}>{labels[status]}</Badge>;
}
