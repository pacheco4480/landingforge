import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import { ProspectStatus } from "@/generated/prisma/client";
import { createProspectAction, updateProspectAction } from "@/features/prospects/actions/prospect.actions";

type ProspectFormValue = {
  id?: string;
  businessName?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  locality?: string | null;
  website?: string | null;
  publicProfileUrl?: string | null;
  sourceUrl?: string | null;
  verifiedAt?: Date | null;
  lastMeaningfulContactAt?: Date | null;
  nextFollowUpAt?: Date | null;
  businessSignals?: string[];
  factualNotes?: string | null;
  qualificationReason?: string | null;
  status?: ProspectStatus;
};

const statusLabels: Record<ProspectStatus, string> = {
  NEW: "Novo", NEEDS_REVIEW: "Por rever", READY_TO_CONTACT: "Pronto para contacto",
  CONTACTED: "Contactado", MANUAL_FOLLOW_UP: "Seguimento manual", INTERESTED: "Interessado",
  NOT_INTERESTED: "Sem interesse", DO_NOT_CONTACT: "Não contactar", CONVERTED: "Convertido", ARCHIVED: "Arquivado",
};

const signalOptions = ["Sem website", "Website desatualizado", "Website não adaptado a mobile", "Falta de formulário claro", "Presença local relevante"];

export function ProspectForm({ prospect }: { prospect?: ProspectFormValue }) {
  const action = prospect?.id ? updateProspectAction : createProspectAction;
  return (
    <Card>
      <ActionFeedbackForm action={action} className="grid gap-6" loadingMessage="A guardar prospect…" successMessage="Prospect guardado.">
        {prospect?.id ? <input type="hidden" name="id" value={prospect.id} /> : null}
        <Stack>
          <Grid className="md:grid-cols-2">
            <Field><Label htmlFor="businessName">Empresa *</Label><Input id="businessName" name="businessName" required maxLength={160} defaultValue={prospect?.businessName ?? ""} /></Field>
            <Field><Label htmlFor="contactName">Contacto profissional</Label><Input id="contactName" name="contactName" maxLength={120} defaultValue={prospect?.contactName ?? ""} /></Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field><Label htmlFor="email">Email profissional</Label><Input id="email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={prospect?.email ?? ""} /></Field>
            <Field><Label htmlFor="phone">Telefone profissional</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={50} defaultValue={prospect?.phone ?? ""} /></Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field><Label htmlFor="industry">Nicho / setor</Label><Input id="industry" name="industry" maxLength={80} defaultValue={prospect?.industry ?? ""} /></Field>
            <Field><Label htmlFor="locality">Localidade / zona</Label><Input id="locality" name="locality" maxLength={120} defaultValue={prospect?.locality ?? ""} /></Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field><Label htmlFor="website">Website</Label><Input id="website" name="website" type="url" placeholder="https://exemplo.pt" maxLength={500} defaultValue={prospect?.website ?? ""} /></Field>
            <Field><Label htmlFor="publicProfileUrl">Perfil empresarial público</Label><Input id="publicProfileUrl" name="publicProfileUrl" type="url" maxLength={500} defaultValue={prospect?.publicProfileUrl ?? ""} /></Field>
          </Grid>
          <Field><Label htmlFor="sourceUrl">URL da fonte consultada</Label><Input id="sourceUrl" name="sourceUrl" type="url" maxLength={1000} defaultValue={prospect?.sourceUrl ?? ""} /><p className="text-muted-foreground text-sm">Regista a página pública onde confirmaste os dados. Não recolhas informação privada.</p></Field>
          <Grid className="md:grid-cols-2">
            <Field><Label htmlFor="verifiedAt">Dados verificados em</Label><Input id="verifiedAt" name="verifiedAt" type="date" defaultValue={prospect?.verifiedAt?.toISOString().slice(0, 10) ?? ""} /></Field>
            <Field><Label htmlFor="nextFollowUpAt">Seguimento manual previsto</Label><Input id="nextFollowUpAt" name="nextFollowUpAt" type="date" defaultValue={prospect?.nextFollowUpAt?.toISOString().slice(0, 10) ?? ""} /></Field>
          </Grid>
          <Field><Label htmlFor="lastMeaningfulContactAt">Último contacto comercial substantivo</Label><Input id="lastMeaningfulContactAt" name="lastMeaningfulContactAt" type="date" defaultValue={prospect?.lastMeaningfulContactAt?.toISOString().slice(0, 10) ?? ""} /><p className="text-muted-foreground text-sm">Campo explícito para a fila de revisão de retenção. Não é preenchido a partir de alterações internas nem atualizado automaticamente.</p></Field>
          <Field>
            <Label>Sinais empresariais observados</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {signalOptions.map((signal) => <label key={signal} className="border-border flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm"><Checkbox name="businessSignals" value={signal} defaultChecked={prospect?.businessSignals?.includes(signal)} />{signal}</label>)}
            </div>
          </Field>
          <Field><Label htmlFor="factualNotes">Observações factuais</Label><Textarea id="factualNotes" name="factualNotes" maxLength={3000} defaultValue={prospect?.factualNotes ?? ""} /><p className="text-muted-foreground text-sm">Descreve apenas informação empresarial pública e verificável. Não registes inferências sensíveis.</p></Field>
          <Grid className="md:grid-cols-2">
            <Field><Label htmlFor="qualificationReason">Motivo de adequação (explicável)</Label><Input id="qualificationReason" name="qualificationReason" maxLength={1000} defaultValue={prospect?.qualificationReason ?? ""} /></Field>
            <Field><Label htmlFor="status">Estado</Label><Select id="status" name="status" defaultValue={prospect?.status === ProspectStatus.DO_NOT_CONTACT ? ProspectStatus.NEEDS_REVIEW : prospect?.status ?? ProspectStatus.NEW}>{Object.values(ProspectStatus).filter((status) => status !== ProspectStatus.DO_NOT_CONTACT).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</Select></Field>
          </Grid>
          <div><Button type="submit">{prospect?.id ? "Guardar alterações" : "Criar prospect"}</Button></div>
        </Stack>
      </ActionFeedbackForm>
    </Card>
  );
}

export { statusLabels as prospectStatusLabels };
