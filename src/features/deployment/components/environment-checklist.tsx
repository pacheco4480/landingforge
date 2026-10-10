import { Status } from "@/components/ui/feedback";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout";

export function EnvironmentChecklist({
  cmsEnabled,
}: {
  cmsEnabled: boolean;
}) {
  const checks = [
    ["DATABASE_URL", Boolean(process.env.DATABASE_URL)],
    ["NEXT_PUBLIC_SITE_URL", Boolean(process.env.NEXT_PUBLIC_SITE_URL)],
    ["AUTH_SECRET", !cmsEnabled || Boolean(process.env.AUTH_SECRET)],
    ["AUTH_URL", !cmsEnabled || Boolean(process.env.AUTH_URL)],
    ["RESEND_API_KEY", Boolean(process.env.RESEND_API_KEY)],
    ["SUPABASE_URL", Boolean(process.env.SUPABASE_URL)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ["CRON_SECRET", Boolean(process.env.CRON_SECRET)],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variáveis de Ambiente</CardTitle>
        <CardDescription>
          Validação de presença sem expor valores sensíveis.
        </CardDescription>
      </CardHeader>
      <div className="grid gap-3">
        {checks.map(([name, complete]) => (
          <div className="flex items-center justify-between gap-3" key={name}>
            <span className="text-sm font-medium">{name}</span>
            <Status tone={complete ? "success" : "warning"}>
              {complete ? "Configurado" : "Em falta"}
            </Status>
          </div>
        ))}
      </div>
    </Card>
  );
}
