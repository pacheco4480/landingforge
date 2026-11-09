import type { EmailDeliveryStatus, EmailDigestFrequency } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/feedback";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout";

export function NotificationOverview({
  overview,
}: {
  overview: {
    frequency: EmailDigestFrequency;
    lastSentAt: Date | null;
    lastStatus: EmailDeliveryStatus | null;
    nextRunAt: Date | null;
  };
}) {
  const frequencyLabels: Record<EmailDigestFrequency, string> = {
    DISABLED: "Desativado",
    DAILY: "Diário",
    WEEKLY: "Semanal",
    MONTHLY: "Mensal",
  };
  const statusLabels: Record<EmailDeliveryStatus, string> = {
    PENDING: "Pendente",
    SENT: "Enviado",
    FAILED: "Falhado",
  };

  return (
    <Card id="notifications">
      <CardHeader>
        <CardTitle>Notificações por email</CardTitle>
        <CardDescription>
          Estado dos resumos periódicos de leads.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap gap-3">
        <Badge tone={overview.frequency === "DISABLED" ? "neutral" : "success"}>
          {frequencyLabels[overview.frequency]}
        </Badge>
        <Badge tone={overview.lastStatus === "FAILED" ? "error" : "info"}>
          {overview.lastStatus ? statusLabels[overview.lastStatus] : "Sem histórico"}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Último envio</dt>
          <dd>
            {overview.lastSentAt
              ? overview.lastSentAt.toLocaleString("pt-PT")
              : "Sem envio"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Próximo envio</dt>
          <dd>
            {overview.nextRunAt
              ? overview.nextRunAt.toLocaleString("pt-PT")
              : "Não agendado"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
