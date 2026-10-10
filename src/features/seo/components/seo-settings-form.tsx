import type { SeoSetting } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  FieldMessage,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import {
  generateStructuredDataAction,
  updateSeoSettingAction,
} from "@/features/seo/actions/seo.actions";

type MediaOption = {
  id: string;
  filename: string;
  publicUrl: string | null;
};

export function SeoSettingsForm({
  seoSetting,
  mediaAssets,
  canWrite,
}: {
  seoSetting: SeoSetting;
  mediaAssets: MediaOption[];
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
        <CardDescription>
          Search, social sharing and indexation settings for this page.
        </CardDescription>
      </CardHeader>
      <form action={updateSeoSettingAction} className="grid gap-5">
        <input name="pageId" type="hidden" value={seoSetting.pageId} />
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={seoSetting.metaTitle}
              disabled={!canWrite}
              minLength={30}
              maxLength={60}
              required
            />
            <FieldMessage>Recommended: 30 to 60 characters.</FieldMessage>
          </Field>
            <Field>
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                name="canonicalUrl"
                defaultValue={seoSetting.canonicalUrl ?? ""}
                disabled={!canWrite}
              />
              <FieldMessage>
                Canonical é metadata SEO. Para mudar o URL publico, altera o
                slug em Pages.
              </FieldMessage>
            </Field>
        </Grid>
        <Field>
          <Label htmlFor="metaDescription">Meta description</Label>
          <Textarea
            id="metaDescription"
            name="metaDescription"
            defaultValue={seoSetting.metaDescription}
            disabled={!canWrite}
            minLength={120}
            maxLength={160}
            required
          />
          <FieldMessage>Recommended: 120 to 160 characters.</FieldMessage>
        </Field>
        <Field>
          <Label htmlFor="keywords">Keywords</Label>
          <Input
            id="keywords"
            name="keywords"
            defaultValue={seoSetting.keywords ?? ""}
            disabled={!canWrite}
          />
        </Field>
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="ogTitle">Open Graph title</Label>
            <Input
              id="ogTitle"
              name="ogTitle"
              defaultValue={seoSetting.ogTitle ?? ""}
              disabled={!canWrite}
            />
          </Field>
          <Field>
            <Label htmlFor="twitterCardType">Twitter/X card</Label>
            <Select
              id="twitterCardType"
              name="twitterCardType"
              defaultValue={seoSetting.twitterCardType ?? "summary_large_image"}
              disabled={!canWrite}
            >
              <option value="summary_large_image">Summary large image</option>
              <option value="summary">Summary</option>
            </Select>
          </Field>
        </Grid>
        <Field>
          <Label htmlFor="ogDescription">Open Graph description</Label>
          <Textarea
            id="ogDescription"
            name="ogDescription"
            defaultValue={seoSetting.ogDescription ?? ""}
            disabled={!canWrite}
          />
        </Field>
        <Field>
          <Label htmlFor="ogImageMediaId">Open Graph image</Label>
          <Select
            id="ogImageMediaId"
            name="ogImageMediaId"
            defaultValue={seoSetting.ogImageMediaId ?? ""}
            disabled={!canWrite}
          >
            <option value="">No image selected</option>
            {mediaAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.filename}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              name="robotsIndex"
              defaultChecked={seoSetting.robotsIndex}
              disabled={!canWrite}
            />
            Index
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              name="robotsFollow"
              defaultChecked={seoSetting.robotsFollow}
              disabled={!canWrite}
            />
            Follow
          </label>
        </div>
        <Field>
          <Label htmlFor="schemaJson">Structured data JSON</Label>
          <Textarea
            className="font-mono text-xs"
            id="schemaJson"
            name="schemaJson"
            defaultValue={
              seoSetting.schemaJson
                ? JSON.stringify(seoSetting.schemaJson, null, 2)
                : ""
            }
            disabled={!canWrite}
            rows={10}
          />
        </Field>
        {canWrite ? <Button type="submit">Save SEO settings</Button> : null}
      </form>
      {canWrite ? (
        <form action={generateStructuredDataAction} className="mt-3">
          <input name="pageId" type="hidden" value={seoSetting.pageId} />
          <Button type="submit" variant="outline">
            Generate structured data
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
