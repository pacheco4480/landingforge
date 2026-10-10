import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
  Stack,
} from "@/components/ui/layout";
import {
  resetBrandColorsAction,
  updateBrandingAction,
} from "@/features/branding/actions/branding.actions";

type BrandingValue = {
  siteName: string;
  businessName: string;
  businessType: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  whatsappUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export function BrandingForm({ settings }: { settings: BrandingValue }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identidade global</CardTitle>
        <CardDescription>
          Dados base usados por SEO, contactos, legal e templates que nao tenham
          valores proprios.
        </CardDescription>
      </CardHeader>
      <ActionFeedbackForm
        action={updateBrandingAction}
        loadingMessage="A guardar branding..."
        successMessage="Branding guardado."
      >
        <Stack>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                defaultValue={settings.businessName}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                name="siteName"
                defaultValue={settings.siteName}
                required
              />
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                name="businessType"
                defaultValue={settings.businessType}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail}
                required
              />
            </Field>
          </Grid>
          <Grid className="md:grid-cols-3">
            <Field>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                defaultValue={settings.primaryColor}
                required
              />
              <p className="text-muted-foreground text-xs">
                Usada por templates sem tema especifico.
              </p>
            </Field>
            <Field>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                defaultValue={settings.secondaryColor}
                required
              />
              <p className="text-muted-foreground text-xs">
                Cor de apoio para fundos, blocos e detalhes.
              </p>
            </Field>
            <Field>
              <Label htmlFor="accentColor">Accent Color</Label>
              <Input
                id="accentColor"
                name="accentColor"
                type="color"
                defaultValue={settings.accentColor}
                required
              />
              <p className="text-muted-foreground text-xs">
                Cor de destaque para CTAs e realces.
              </p>
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                defaultValue={settings.contactPhone ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={settings.address ?? ""}
              />
            </Field>
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                name="facebookUrl"
                defaultValue={settings.facebookUrl ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                name="instagramUrl"
                defaultValue={settings.instagramUrl ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                defaultValue={settings.linkedinUrl ?? ""}
              />
            </Field>
            <Field>
              <Label htmlFor="whatsappUrl">WhatsApp URL</Label>
              <Input
                id="whatsappUrl"
                name="whatsappUrl"
                defaultValue={settings.whatsappUrl ?? ""}
              />
            </Field>
          </Grid>
          <Button type="submit">Save branding</Button>
        </Stack>
      </ActionFeedbackForm>
      <ActionFeedbackForm
        action={resetBrandColorsAction}
        className="mt-4"
        loadingMessage="A repor cores..."
        successMessage="Cores repostas."
      >
        <Button type="submit" variant="outline">
          Reset colors
        </Button>
      </ActionFeedbackForm>
    </Card>
  );
}
