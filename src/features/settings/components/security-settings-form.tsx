import type { SecuritySetting } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Label } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { updateSecuritySettingsAction } from "@/features/settings/actions/security-settings.actions";

export function SecuritySettingsForm({
  settings,
  canWrite,
}: {
  settings: SecuritySetting;
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Proteções contra spam, abuso e utilização excessiva.
        </CardDescription>
      </CardHeader>
      <div className="mb-5 flex flex-wrap gap-3">
        <Badge tone={settings.turnstileEnabled ? "success" : "neutral"}>
          Turnstile {settings.turnstileEnabled ? "ativo" : "inativo"}
        </Badge>
        <Badge tone={settings.honeypotEnabled ? "success" : "neutral"}>
          Honeypot {settings.honeypotEnabled ? "ativo" : "inativo"}
        </Badge>
      </div>
      <ActionFeedbackForm
        action={updateSecuritySettingsAction}
        className="grid gap-4"
        loadingMessage="A guardar segurança..."
        successMessage="Segurança guardada."
      >
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              name="turnstileEnabled"
              defaultChecked={settings.turnstileEnabled}
              disabled={!canWrite}
            />
            Turnstile
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              name="honeypotEnabled"
              defaultChecked={settings.honeypotEnabled}
              disabled={!canWrite}
            />
            Honeypot
          </label>
        </div>
        <Field>
          <Label htmlFor="turnstileSiteKey">Turnstile site key</Label>
          <Input
            id="turnstileSiteKey"
            name="turnstileSiteKey"
            defaultValue={settings.turnstileSiteKey ?? ""}
            disabled={!canWrite}
            placeholder="Secret key fica apenas nas variáveis de ambiente"
          />
        </Field>
        <Grid className="md:grid-cols-3">
          <NumberField name="loginLimitPerMinute" label="Login/min" value={settings.loginLimitPerMinute} disabled={!canWrite} />
          <NumberField name="passwordResetLimitPerHour" label="Reset/hora" value={settings.passwordResetLimitPerHour} disabled={!canWrite} />
          <NumberField name="formLimitPerMinute" label="Forms/min" value={settings.formLimitPerMinute} disabled={!canWrite} />
          <NumberField name="uploadLimitPerMinute" label="Uploads/min" value={settings.uploadLimitPerMinute} disabled={!canWrite} />
          <NumberField name="apiLimitPerMinute" label="APIs/min" value={settings.apiLimitPerMinute} disabled={!canWrite} />
          <NumberField name="duplicateCooldownSeconds" label="Cooldown form" value={settings.duplicateCooldownSeconds} disabled={!canWrite} />
        </Grid>
        {canWrite ? <Button type="submit">Guardar segurança</Button> : null}
      </ActionFeedbackForm>
    </Card>
  );
}

function NumberField({
  name,
  label,
  value,
  disabled,
}: {
  name: string;
  label: string;
  value: number;
  disabled: boolean;
}) {
  return (
    <Field>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" min={1} defaultValue={value} disabled={disabled} required />
    </Field>
  );
}
