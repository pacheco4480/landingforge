import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import { ClientStatus } from "@/generated/prisma/client";
import {
  createClientAction,
  updateClientAction,
} from "@/features/clients/actions/client.actions";

type ClientFormValue = {
  id?: string;
  name?: string;
  businessName?: string;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  vatNumber?: string | null;
  internalNotes?: string | null;
  lastMeaningfulContactAt?: Date | null;
  status?: ClientStatus;
};

const statusLabels: Record<ClientStatus, string> = {
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

export function ClientForm({
  client,
  canEditNotes,
}: {
  client?: ClientFormValue;
  canEditNotes: boolean;
}) {
  const action = client?.id ? updateClientAction : createClientAction;

  return (
    <Card>
      <ActionFeedbackForm
        action={action}
        className="grid gap-6"
        loadingMessage={client?.id ? "A guardar cliente…" : "A criar cliente…"}
        successMessage="Cliente guardado."
      >
        {client?.id ? <input name="id" type="hidden" value={client.id} /> : null}
        <Stack>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="businessName">Empresa</Label>
              <Input id="businessName" name="businessName" required defaultValue={client?.businessName ?? ""} maxLength={160} />
            </Field>
            <Field>
              <Label htmlFor="name">Pessoa de contacto</Label>
              <Input id="name" name="name" required defaultValue={client?.name ?? ""} maxLength={120} />
            </Field>
          </Grid>
          <Field>
            <Label htmlFor="lastMeaningfulContactAt">Último contacto comercial relevante</Label>
            <Input id="lastMeaningfulContactAt" name="lastMeaningfulContactAt" type="date" defaultValue={client?.lastMeaningfulContactAt?.toISOString().slice(0, 10) ?? ""} />
            <p className="text-muted-foreground text-sm">Usado apenas para sinalizar contactos de prospeção que precisam de revisão de retenção. Não é atualizado automaticamente por alterações internas.</p>
          </Field>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="industry">Setor</Label>
              <Input id="industry" name="industry" defaultValue={client?.industry ?? ""} maxLength={80} />
            </Field>
            <Field>
              <Label htmlFor="status">Estado comercial</Label>
              <Select id="status" name="status" defaultValue={client?.status ?? ClientStatus.LEAD}>
                {Object.values(ClientStatus).map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </Select>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" defaultValue={client?.email ?? ""} maxLength={254} />
            </Field>
            <Field>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={client?.phone ?? ""} maxLength={50} />
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" placeholder="https://exemplo.pt" defaultValue={client?.website ?? ""} maxLength={300} />
            </Field>
            <Field>
              <Label htmlFor="vatNumber">NIF / NIPC</Label>
              <Input id="vatNumber" name="vatNumber" defaultValue={client?.vatNumber ?? ""} maxLength={40} />
            </Field>
          </Grid>
          <Field>
            <Label htmlFor="address">Morada</Label>
            <Input id="address" name="address" autoComplete="street-address" defaultValue={client?.address ?? ""} maxLength={400} />
          </Field>
          {canEditNotes ? (
            <Field>
              <Label htmlFor="internalNotes">Notas internas</Label>
              <Textarea id="internalNotes" name="internalNotes" defaultValue={client?.internalNotes ?? ""} maxLength={5000} />
              <p className="text-muted-foreground text-sm">Não incluas credenciais, dados de pagamento nem dados clínicos ou de saúde.</p>
            </Field>
          ) : null}
          <div>
            <Button type="submit">{client?.id ? "Guardar cliente" : "Criar cliente"}</Button>
          </div>
        </Stack>
      </ActionFeedbackForm>
    </Card>
  );
}
