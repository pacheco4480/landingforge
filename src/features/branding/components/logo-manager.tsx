import { Button } from "@/components/ui/button";
import { Field, Label, Select } from "@/components/ui/form";
import { Card, Grid } from "@/components/ui/layout";
import { updateBrandAssetAction } from "@/features/branding/actions/branding.actions";

type AssetOption = {
  id: string;
  filename: string;
  mimeType: string;
};

export function LogoManager({
  logoId,
  faviconId,
  assets,
}: {
  logoId: string | null;
  faviconId: string | null;
  assets: AssetOption[];
}) {
  const imageAssets = assets.filter((asset) =>
    asset.mimeType.startsWith("image/"),
  );

  return (
    <Grid className="lg:grid-cols-2">
      <BrandAssetForm asset="logo" currentId={logoId} assets={imageAssets} />
      <BrandAssetForm
        asset="favicon"
        currentId={faviconId}
        assets={imageAssets}
      />
    </Grid>
  );
}

function BrandAssetForm({
  asset,
  currentId,
  assets,
}: {
  asset: "logo" | "favicon";
  currentId: string | null;
  assets: AssetOption[];
}) {
  return (
    <Card>
      <form action={updateBrandAssetAction} className="grid gap-4">
        <input name="asset" type="hidden" value={asset} />
        <Field>
          <Label htmlFor={`${asset}-media`}>
            {asset === "logo" ? "Logo" : "Favicon"}
          </Label>
          <Select
            id={`${asset}-media`}
            name="mediaId"
            defaultValue={currentId ?? ""}
          >
            <option value="">No asset</option>
            {assets.map((media) => (
              <option key={media.id} value={media.id}>
                {media.filename}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline">
          Save {asset}
        </Button>
      </form>
    </Card>
  );
}
