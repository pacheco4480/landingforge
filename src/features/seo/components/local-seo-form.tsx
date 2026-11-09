import type { SiteSetting } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import { updateLocalSeoAction } from "@/features/seo/actions/seo.actions";

export function LocalSeoForm({
  site,
  canWrite,
}: {
  site: SiteSetting;
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO local</CardTitle>
        <CardDescription>
          Dados de localização da empresa utilizados nos dados estruturados locais.
        </CardDescription>
      </CardHeader>
      <form action={updateLocalSeoAction} className="grid gap-5">
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="city">Localidade</Label>
            <Input
              id="city"
              name="city"
              defaultValue={site.city ?? ""}
              disabled={!canWrite}
            />
          </Field>
          <Field>
            <Label htmlFor="region">Distrito ou região</Label>
            <Input
              id="region"
              name="region"
              defaultValue={site.region ?? ""}
              disabled={!canWrite}
            />
          </Field>
          <Field>
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              name="country"
              defaultValue={site.country ?? ""}
              disabled={!canWrite}
            />
          </Field>
          <Field>
            <Label htmlFor="postalCode">Código postal</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={site.postalCode ?? ""}
              disabled={!canWrite}
            />
          </Field>
          <Field>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              name="latitude"
              defaultValue={site.latitude ?? ""}
              disabled={!canWrite}
            />
          </Field>
          <Field>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              name="longitude"
              defaultValue={site.longitude ?? ""}
              disabled={!canWrite}
            />
          </Field>
        </Grid>
        <Field>
          <Label htmlFor="openingHours">Horário de funcionamento</Label>
          <Textarea
            id="openingHours"
            name="openingHours"
            defaultValue={site.openingHours ?? ""}
            disabled={!canWrite}
          />
        </Field>
        {canWrite ? <Button type="submit">Guardar SEO local</Button> : null}
      </form>
    </Card>
  );
}
