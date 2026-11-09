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
        <CardTitle>Metadados</CardTitle>
        <CardDescription>
          Definições de pesquisa, partilha social e indexação desta página.
        </CardDescription>
      </CardHeader>
      <form action={updateSeoSettingAction} className="grid gap-5">
        <input name="pageId" type="hidden" value={seoSetting.pageId} />
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="metaTitle">Título SEO</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              defaultValue={seoSetting.metaTitle}
              disabled={!canWrite}
              minLength={30}
              maxLength={60}
              required
            />
            <FieldMessage>Recomendado: entre 30 e 60 caracteres.</FieldMessage>
          </Field>
            <Field>
              <Label htmlFor="canonicalUrl">URL canónico</Label>
              <Input
                id="canonicalUrl"
                name="canonicalUrl"
                defaultValue={seoSetting.canonicalUrl ?? ""}
                disabled={!canWrite}
              />
              <FieldMessage>
                O URL canónico é um metadado de SEO. Para alterar o endereço
                público, atualiza o slug em Páginas.
              </FieldMessage>
            </Field>
        </Grid>
        <Field>
          <Label htmlFor="metaDescription">Descrição SEO</Label>
          <Textarea
            id="metaDescription"
            name="metaDescription"
            defaultValue={seoSetting.metaDescription}
            disabled={!canWrite}
            minLength={120}
            maxLength={160}
            required
          />
          <FieldMessage>Recomendado: entre 120 e 160 caracteres.</FieldMessage>
        </Field>
        <Field>
          <Label htmlFor="keywords">Palavras-chave</Label>
          <Input
            id="keywords"
            name="keywords"
            defaultValue={seoSetting.keywords ?? ""}
            disabled={!canWrite}
          />
        </Field>
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor="ogTitle">Título para partilha (Open Graph)</Label>
            <Input
              id="ogTitle"
              name="ogTitle"
              defaultValue={seoSetting.ogTitle ?? ""}
              disabled={!canWrite}
            />
          </Field>
          <Field>
            <Label htmlFor="twitterCardType">Formato do cartão Twitter/X</Label>
            <Select
              id="twitterCardType"
              name="twitterCardType"
              defaultValue={seoSetting.twitterCardType ?? "summary_large_image"}
              disabled={!canWrite}
            >
              <option value="summary_large_image">Resumo com imagem grande</option>
              <option value="summary">Resumo</option>
            </Select>
          </Field>
        </Grid>
        <Field>
          <Label htmlFor="ogDescription">Descrição para partilha (Open Graph)</Label>
          <Textarea
            id="ogDescription"
            name="ogDescription"
            defaultValue={seoSetting.ogDescription ?? ""}
            disabled={!canWrite}
          />
        </Field>
        <Field>
          <Label htmlFor="ogImageMediaId">Imagem para partilha (Open Graph)</Label>
          <Select
            id="ogImageMediaId"
            name="ogImageMediaId"
            defaultValue={seoSetting.ogImageMediaId ?? ""}
            disabled={!canWrite}
          >
            <option value="">Sem imagem selecionada</option>
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
            Permitir indexação
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              name="robotsFollow"
              defaultChecked={seoSetting.robotsFollow}
              disabled={!canWrite}
            />
            Seguir ligações
          </label>
        </div>
        <Field>
          <Label htmlFor="schemaJson">Dados estruturados (JSON-LD)</Label>
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
        {canWrite ? <Button type="submit">Guardar definições de SEO</Button> : null}
      </form>
      {canWrite ? (
        <form action={generateStructuredDataAction} className="mt-3">
          <input name="pageId" type="hidden" value={seoSetting.pageId} />
          <Button type="submit" variant="outline">
            Gerar dados estruturados
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
