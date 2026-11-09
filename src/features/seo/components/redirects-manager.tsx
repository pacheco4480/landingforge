import type { Redirect } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-display";
import { Field, Input, Label, Select } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import {
  deleteRedirectAction,
  upsertRedirectAction,
} from "@/features/seo/actions/redirect.actions";

export function RedirectsManager({
  redirects,
  canWrite,
}: {
  redirects: Redirect[];
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redirecionamentos</CardTitle>
        <CardDescription>
          Regras de migração de URL através de códigos 301 e 302.
        </CardDescription>
      </CardHeader>
      {canWrite ? (
        <form action={upsertRedirectAction} className="mb-6 grid gap-4">
          <Grid className="md:grid-cols-[1fr_1fr_140px]">
            <Field>
              <Label htmlFor="fromPath">Origem</Label>
              <Input id="fromPath" name="fromPath" placeholder="/old-page" />
            </Field>
            <Field>
              <Label htmlFor="toPath">Destino</Label>
              <Input id="toPath" name="toPath" placeholder="/new-page" />
            </Field>
            <Field>
              <Label htmlFor="statusCode">Código</Label>
              <Select id="statusCode" name="statusCode" defaultValue="301">
                <option value="301">301</option>
                <option value="302">302</option>
              </Select>
            </Field>
          </Grid>
          <Button type="submit">Adicionar redirecionamento</Button>
        </form>
      ) : null}
      <DataTable
        columns={["Origem", "Destino", "Código", "Ação"]}
        rows={redirects.map((redirect) => [
          redirect.fromPath,
          redirect.toPath,
          redirect.statusCode,
          canWrite ? (
            <form action={deleteRedirectAction} key={redirect.id}>
              <input name="id" type="hidden" value={redirect.id} />
              <Button type="submit" variant="destructive" size="sm">
                Eliminar
              </Button>
            </form>
          ) : (
            "Só de leitura"
          ),
        ])}
      />
    </Card>
  );
}
