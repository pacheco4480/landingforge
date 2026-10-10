import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import { saveThemeAction } from "@/features/branding/actions/theme.actions";

type ThemeFormValue = {
  id?: string;
  name?: string;
  key?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textPrimaryColor?: string;
  textSecondaryColor?: string;
  headingFont?: string;
  bodyFont?: string;
  borderRadius?: string;
  shadowStyle?: string;
};

export function ThemeForm({ theme }: { theme?: ThemeFormValue }) {
  return (
    <Card>
      <form action={saveThemeAction}>
        {theme?.id ? <input name="id" type="hidden" value={theme.id} /> : null}
        <Stack>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="theme-name">Theme Name</Label>
              <Input
                id="theme-name"
                name="name"
                defaultValue={theme?.name ?? ""}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="theme-key">Theme Key</Label>
              <Input
                id="theme-key"
                name="key"
                defaultValue={theme?.key ?? ""}
                required
              />
            </Field>
          </Grid>
          <Grid className="md:grid-cols-3">
            {[
              ["primaryColor", "Primary"],
              ["secondaryColor", "Secondary"],
              ["accentColor", "Accent"],
              ["backgroundColor", "Background"],
              ["surfaceColor", "Surface"],
              ["textPrimaryColor", "Text Primary"],
              ["textSecondaryColor", "Text Secondary"],
            ].map(([name, label]) => (
              <Field key={name}>
                <Label htmlFor={`theme-${name}`}>{label}</Label>
                <Input
                  id={`theme-${name}`}
                  name={name}
                  type="color"
                  defaultValue={
                    (theme?.[name as keyof ThemeFormValue] as string) ??
                    "#ffffff"
                  }
                  required
                />
              </Field>
            ))}
          </Grid>
          <Grid className="md:grid-cols-2">
            <Field>
              <Label htmlFor="theme-headingFont">Heading Font</Label>
              <Input
                id="theme-headingFont"
                name="headingFont"
                defaultValue={theme?.headingFont ?? "Arial"}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="theme-bodyFont">Body Font</Label>
              <Input
                id="theme-bodyFont"
                name="bodyFont"
                defaultValue={theme?.bodyFont ?? "Arial"}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="theme-borderRadius">Radius</Label>
              <Select
                id="theme-borderRadius"
                name="borderRadius"
                defaultValue={theme?.borderRadius ?? "medium"}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="theme-shadowStyle">Shadow</Label>
              <Select
                id="theme-shadowStyle"
                name="shadowStyle"
                defaultValue={theme?.shadowStyle ?? "small"}
              >
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </Select>
            </Field>
          </Grid>
          <Button type="submit">
            {theme?.id ? "Save theme" : "Create theme"}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
