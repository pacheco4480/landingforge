import { Card, Grid } from "@/components/ui/layout";
import {
  getContrastRatio,
  meetsWcagAa,
} from "@/features/branding/services/contrast.service";

type ThemePreviewValue = {
  name: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
};

export function ThemePreview({ theme }: { theme: ThemePreviewValue }) {
  const passes = meetsWcagAa(theme.textPrimaryColor, theme.backgroundColor);

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Theme Preview</h3>
        <p className="text-muted-foreground text-sm">
          Contrast ratio:{" "}
          {getContrastRatio(
            theme.textPrimaryColor,
            theme.backgroundColor,
          ).toFixed(2)}{" "}
          ({passes ? "AA" : "Needs work"})
        </p>
      </div>
      <Grid className="md:grid-cols-3">
        {["Desktop", "Tablet", "Mobile"].map((viewport) => (
          <div
            key={viewport}
            className="rounded-md border p-4"
            style={{
              background: theme.backgroundColor,
              color: theme.textPrimaryColor,
            }}
          >
            <p className="text-xs font-semibold uppercase">{viewport}</p>
            <div
              className="mt-3 rounded-md p-3"
              style={{ background: theme.surfaceColor }}
            >
              <h4 className="font-bold">{theme.name}</h4>
              <p
                className="mt-2 text-sm"
                style={{ color: theme.textSecondaryColor }}
              >
                Landing page content preview.
              </p>
              <button
                className="mt-4 rounded-md px-3 py-2 text-sm font-semibold"
                style={{ background: theme.primaryColor, color: "#ffffff" }}
                type="button"
              >
                Primary CTA
              </button>
            </div>
          </div>
        ))}
      </Grid>
    </Card>
  );
}
