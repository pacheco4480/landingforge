import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/feedback";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout";

export function SecurityOverview({
  summary,
}: {
  summary: {
    blocked: number;
    rateLimited: number;
    spam: number;
    turnstileFailed: number;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Overview</CardTitle>
        <CardDescription>Eventos bloqueados nas últimas 24 horas.</CardDescription>
      </CardHeader>
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-primary size-5" aria-hidden="true" />
        <Badge tone="info">{summary.blocked} eventos</Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Rate limit</dt><dd>{summary.rateLimited}</dd></div>
        <div><dt className="text-muted-foreground">Spam</dt><dd>{summary.spam}</dd></div>
        <div><dt className="text-muted-foreground">Turnstile</dt><dd>{summary.turnstileFailed}</dd></div>
      </dl>
    </Card>
  );
}
