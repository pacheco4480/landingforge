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
              <Label htmlFor="theme-name">Nome do tema</Label>
              <Input
                id="theme-name"
                name="name"
                defaultValue={theme?.name ?? ""}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="theme-key">Identificador do tema</Label>
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
              ["primaryColor", "Principal"],
              ["secondaryColor", "Secundária"],
              ["accentColor", "Destaque"],
              ["backgroundColor", "Fundo"],
              ["surfaceColor", "Superfície"],
              ["textPrimaryColor", "Texto principal"],
              ["textSecondaryColor", "Texto secundário"],
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
              <Label htmlFor="theme-headingFont">Tipo de letra dos títulos</Label>
              <Input
                id="theme-headingFont"
                name="headingFont"
                defaultValue={theme?.headingFont ?? "Arial"}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="theme-bodyFont">Tipo de letra do corpo</Label>
              <Input
                id="theme-bodyFont"
                name="bodyFont"
                defaultValue={theme?.bodyFont ?? "Arial"}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="theme-borderRadius">Arredondamento</Label>
              <Select
                id="theme-borderRadius"
                name="borderRadius"
                defaultValue={theme?.borderRadius ?? "medium"}
              >
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="theme-shadowStyle">Sombra</Label>
              <Select
                id="theme-shadowStyle"
                name="shadowStyle"
                defaultValue={theme?.shadowStyle ?? "small"}
              >
                <option value="none">Nenhuma</option>
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
              </Select>
            </Field>
          </Grid>
          <Button type="submit">
            {theme?.id ? "Guardar tema" : "Criar tema"}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
