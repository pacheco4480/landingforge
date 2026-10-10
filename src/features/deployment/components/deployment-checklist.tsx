import { CheckCircle2, CircleAlert } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout";
import type { DeliveryChecklistItem } from "@/features/deployment/services/deployment.service";

export function DeploymentChecklist({
  items,
}: {
  items: DeliveryChecklistItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de Entrega</CardTitle>
        <CardDescription>
          Pontos mínimos para validar antes de publicar ou entregar ao cliente.
        </CardDescription>
      </CardHeader>
      <div className="grid gap-3">
        {items.map((item) => {
          const Icon = item.complete ? CheckCircle2 : CircleAlert;

          return (
            <div
              className="border-border bg-background flex items-start gap-3 rounded-md border p-3"
              key={item.key}
            >
              <Icon
                className={
                  item.complete
                    ? "text-success mt-0.5 size-4"
                    : "text-warning mt-0.5 size-4"
                }
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
