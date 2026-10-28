import { Badge } from "@/components/ui/feedback";
import { ProjectStatus } from "@/generated/prisma/client";

const labels: Record<ProjectStatus, string> = {
  [ProjectStatus.BRIEFING]: "Briefing",
  [ProjectStatus.CONTENT_COLLECTION]: "Recolha de conteúdos",
  [ProjectStatus.PLANNING]: "Planeamento",
  [ProjectStatus.DEVELOPMENT]: "Desenvolvimento",
  [ProjectStatus.REVIEW]: "Revisão",
  [ProjectStatus.APPROVED]: "Aprovado",
  [ProjectStatus.DELIVERED]: "Entregue",
  [ProjectStatus.MAINTENANCE]: "Manutenção",
  [ProjectStatus.ARCHIVED]: "Arquivado",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const tone =
    status === ProjectStatus.DELIVERED || status === ProjectStatus.MAINTENANCE
      ? "success"
      : status === ProjectStatus.REVIEW
        ? "warning"
        : status === ProjectStatus.ARCHIVED
          ? "neutral"
          : "info";
  return <Badge tone={tone}>{labels[status]}</Badge>;
}
