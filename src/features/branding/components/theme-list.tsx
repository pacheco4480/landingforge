import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { Card, Grid } from "@/components/ui/layout";
import {
  applyThemeAction,
  duplicateThemeAction,
} from "@/features/branding/actions/theme.actions";
import { ThemePreview } from "@/features/branding/components/theme-preview";

type Theme = {
  id: string;
  name: string;
  key: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
};

type Page = { id: string; title: string };

export function ThemeList({
  themes,
  pages,
}: {
  themes: Theme[];
  pages: Page[];
}) {
  return (
    <Grid>
      {themes.map((theme) => (
        <Card key={theme.id}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{theme.name}</h3>
              <Badge>{theme.key}</Badge>
            </div>
            <form action={duplicateThemeAction}>
              <input name="id" type="hidden" value={theme.id} />
              <Button type="submit" variant="outline">
                Duplicate
              </Button>
            </form>
          </div>
          <ThemePreview theme={theme} />
          <form
            action={applyThemeAction}
            className="mt-4 flex flex-col gap-3 md:flex-row"
          >
            <input name="themeId" type="hidden" value={theme.id} />
            <Select name="pageId" required>
              <option value="">Apply to page</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </Select>
            <Button type="submit">Apply</Button>
          </form>
        </Card>
      ))}
    </Grid>
  );
}
