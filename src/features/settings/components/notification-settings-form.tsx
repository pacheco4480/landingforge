import { EmailDigestFrequency } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Field, Input, Label, Select } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { updateNotificationSettingsAction } from "@/features/settings/actions/notification-settings.actions";

const weekdays = [
  ["0", "Domingo"],
  ["1", "Segunda-feira"],
  ["2", "Terça-feira"],
  ["3", "Quarta-feira"],
  ["4", "Quinta-feira"],
  ["5", "Sexta-feira"],
  ["6", "Sábado"],
] as const;

export function NotificationSettingsForm({
  settings,
  canWrite,
}: {
  settings: {
    frequency: EmailDigestFrequency;
    hour: number;
    weekday: number;
    timezone: string;
    recipient: string | null;
    lastSentAt: Date | null;
    lastStatus: string | null;
    nextRunAt: Date | null;
  };
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configure resumos periódicos de leads sem enviar email por cada lead.
        </CardDescription>
      </CardHeader>
      <div className="mb-5 flex flex-wrap gap-3">
        <Badge tone={settings.frequency === "DISABLED" ? "neutral" : "success"}>
          {settings.frequency === "DISABLED" ? "Desativado" : "Ativo"}
        </Badge>
        <Badge tone="info">
          Último envio:{" "}
          {settings.lastSentAt
            ? settings.lastSentAt.toLocaleString("pt-PT")
            : "sem envio"}
        </Badge>
        <Badge tone="info">
          Próximo envio:{" "}
          {settings.nextRunAt
            ? settings.nextRunAt.toLocaleString("pt-PT")
            : "não agendado"}
        </Badge>
      </div>
      <ActionFeedbackForm
        action={updateNotificationSettingsAction}
        className="grid gap-4"
        loadingMessage="A guardar notificações..."
        successMessage="Notificações guardadas."
      >
        <Grid className="md:grid-cols-2 xl:grid-cols-4">
          <Field>
            <Label htmlFor="frequency">Frequência</Label>
            <Select
              id="frequency"
              name="frequency"
              defaultValue={settings.frequency}
              disabled={!canWrite}
            >
              <option value={EmailDigestFrequency.DISABLED}>Disabled</option>
              <option value={EmailDigestFrequency.DAILY}>Daily</option>
              <option value={EmailDigestFrequency.WEEKLY}>Weekly</option>
              <option value={EmailDigestFrequency.MONTHLY}>Monthly</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="hour">Hora preferida</Label>
            <Input
              id="hour"
              name="hour"
              type="number"
              min={0}
              max={23}
              defaultValue={settings.hour}
              disabled={!canWrite}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="weekday">Dia semanal</Label>
            <Select
              id="weekday"
              name="weekday"
              defaultValue={String(settings.weekday)}
              disabled={!canWrite}
            >
              {weekdays.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              id="timezone"
              name="timezone"
              defaultValue={settings.timezone}
              disabled={!canWrite}
            >
              <option value="Europe/Lisbon">Europe/Lisbon</option>
            </Select>
          </Field>
        </Grid>
        <Field>
          <Label htmlFor="recipient">Destinatário</Label>
          <Input
            id="recipient"
            name="recipient"
            type="email"
            defaultValue={settings.recipient ?? ""}
            placeholder="Usa o email de contacto quando vazio"
            disabled={!canWrite}
          />
        </Field>
        {canWrite ? <Button type="submit">Guardar notificações</Button> : null}
      </ActionFeedbackForm>
    </Card>
  );
}
