import type { LegalSetting, PageStatus } from "@/generated/prisma/client";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Label, Select } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import {
  ensureLegalPagesAction,
  saveLegalSettingsAction,
} from "@/features/legal/actions/legal.actions";

type LegalPageOption = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
};

export function LegalSettingsForm({
  canWrite,
  legalPages,
  settings,
}: {
  canWrite: boolean;
  legalPages: LegalPageOption[];
  settings: LegalSetting;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal e RGPD</CardTitle>
        <CardDescription>
          Configuracao de cookies, consentimento e paginas legais.
        </CardDescription>
      </CardHeader>
      <div className="grid gap-5">
        <ActionFeedbackForm
          action={saveLegalSettingsAction}
          className="grid gap-5"
          loadingMessage="A guardar configuracao legal..."
          successMessage="Configuracao legal guardada."
        >
          <input name="id" type="hidden" value={settings.id} />
          <Grid className="md:grid-cols-3">
            <Field>
              <Label htmlFor="consentVersion">Versao de consentimento</Label>
              <Input
                id="consentVersion"
                name="consentVersion"
                defaultValue={settings.consentVersion}
                disabled={!canWrite}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="retentionDays">Retencao de dados em dias</Label>
              <Input
                id="retentionDays"
                name="retentionDays"
                type="number"
                defaultValue={settings.retentionDays}
                disabled={!canWrite}
                required
              />
            </Field>
            <label className="mt-8 flex items-center gap-2 text-sm font-medium">
              <Checkbox
                name="cookieBannerEnabled"
                defaultChecked={settings.cookieBannerEnabled}
                disabled={!canWrite}
              />
              Banner de cookies ativo
            </label>
          </Grid>
          <Grid className="md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                name="analyticsCookiesEnabled"
                defaultChecked={settings.analyticsCookiesEnabled}
                disabled={!canWrite}
              />
              Permitir categoria Analytics
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                name="marketingCookiesEnabled"
                defaultChecked={settings.marketingCookiesEnabled}
                disabled={!canWrite}
              />
              Permitir categoria Marketing
            </label>
          </Grid>
          <Grid className="md:grid-cols-3">
            <PageSelect
              label="Politica de Privacidade"
              name="privacyPageId"
              pages={legalPages}
              value={settings.privacyPageId}
              disabled={!canWrite}
            />
            <PageSelect
              label="Politica de Cookies"
              name="cookiePageId"
              pages={legalPages}
              value={settings.cookiePageId}
              disabled={!canWrite}
            />
            <PageSelect
              label="Termos e Condicoes"
              name="termsPageId"
              pages={legalPages}
              value={settings.termsPageId}
              disabled={!canWrite}
            />
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="dataControllerName">Responsavel pelo tratamento</Label>
              <Input
                id="dataControllerName"
                name="dataControllerName"
                defaultValue={settings.dataControllerName ?? ""}
                disabled={!canWrite}
              />
            </Field>
            <Field>
              <Label htmlFor="dataControllerEmail">Email para pedidos RGPD</Label>
              <Input
                id="dataControllerEmail"
                name="dataControllerEmail"
                type="email"
                defaultValue={settings.dataControllerEmail ?? ""}
                disabled={!canWrite}
              />
            </Field>
          </Grid>
          {canWrite ? <Button type="submit">Guardar legal</Button> : null}
        </ActionFeedbackForm>
        {canWrite ? (
          <ActionFeedbackForm
            action={ensureLegalPagesAction}
            loadingMessage="A criar paginas legais..."
            successMessage="Paginas legais preparadas."
          >
            <Button type="submit" variant="outline">
              Criar/atualizar paginas legais
            </Button>
          </ActionFeedbackForm>
        ) : null}
      </div>
    </Card>
  );
}

function PageSelect({
  disabled,
  label,
  name,
  pages,
  value,
}: {
  disabled: boolean;
  label: string;
  name: string;
  pages: LegalPageOption[];
  value: string | null;
}) {
  return (
    <Field>
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} defaultValue={value ?? ""} disabled={disabled}>
        <option value="">Nao configurada</option>
        {pages.map((page) => (
          <option key={page.id} value={page.id}>
            {page.title} /{page.slug}
          </option>
        ))}
      </Select>
    </Field>
  );
}
