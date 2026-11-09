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
  canWrite,
}: {
  logoId: string | null;
  faviconId: string | null;
  assets: AssetOption[];
  canWrite: boolean;
}) {
  const imageAssets = assets.filter((asset) =>
    asset.mimeType.startsWith("image/"),
  );

  return (
    <Grid className="lg:grid-cols-2">
      <BrandAssetForm asset="logo" currentId={logoId} assets={imageAssets} canWrite={canWrite} />
      <BrandAssetForm
        asset="favicon"
        currentId={faviconId}
        assets={imageAssets}
        canWrite={canWrite}
      />
    </Grid>
  );
}

function BrandAssetForm({
  asset,
  currentId,
  assets,
  canWrite,
}: {
  asset: "logo" | "favicon";
  currentId: string | null;
  assets: AssetOption[];
  canWrite: boolean;
}) {
  const currentAsset = assets.find((item) => item.id === currentId);

  if (!canWrite) {
    return (
      <Card>
        <p className="text-sm font-medium">{asset === "logo" ? "Logótipo" : "Favicon"}</p>
        <p className="text-muted-foreground mt-2 text-sm">{currentAsset?.filename ?? "Não definido"}</p>
      </Card>
    );
  }

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
            <option value="">Sem recurso selecionado</option>
            {assets.map((media) => (
              <option key={media.id} value={media.id}>
                {media.filename}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline">
          Guardar {asset === "logo" ? "logótipo" : "favicon"}
        </Button>
      </form>
    </Card>
  );
}
