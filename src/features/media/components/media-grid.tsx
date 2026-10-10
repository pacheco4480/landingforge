import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Card, Grid } from "@/components/ui/layout";
import {
  ActionFeedbackForm,
  ConfirmActionForm,
} from "@/components/ui/action-feedback";
import {
  deleteMediaAction,
  duplicateMediaAction,
  updateMediaMetadataAction,
} from "@/features/media/actions/media.actions";
import { MediaPreview } from "@/features/media/components/media-preview";

type Folder = { id: string; name: string };
type Asset = {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  publicUrl: string | null;
  tags: unknown;
  folderId: string | null;
  createdAt: Date;
  createdByUser: { name: string; email: string } | null;
};

function tagsText(tags: unknown) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

export function MediaGrid({
  assets,
  folders,
  canWrite,
  canDelete,
}: {
  assets: Asset[];
  folders: Folder[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  if (assets.length === 0) {
    return (
      <Card>
        <p className="font-semibold">No media yet</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Upload images, videos or documents to start building the media
          library.
        </p>
      </Card>
    );
  }

  return (
    <Grid className="xl:grid-cols-2">
      {assets.map((asset) => (
        <Card key={asset.id}>
          <MediaPreview
            filename={asset.filename}
            mimeType={asset.mimeType}
            publicUrl={asset.publicUrl}
          />
          <div className="mt-4">
            <h3 className="font-semibold">{asset.filename}</h3>
            <p className="text-muted-foreground text-sm">
              {asset.mimeType} / {(asset.sizeBytes / 1024).toFixed(1)} KB
            </p>
            {asset.publicUrl ? (
              <p className="text-muted-foreground mt-2 break-all text-xs">
                URL publica:{" "}
                <a
                  className="font-medium underline"
                  href={asset.publicUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {asset.publicUrl}
                </a>
              </p>
            ) : null}
          </div>
          {canWrite ? (
            <div className="mt-4 grid gap-3">
              <ActionFeedbackForm
                action={updateMediaMetadataAction}
                className="grid gap-3"
                loadingMessage="A guardar media..."
                successMessage="Media guardada."
              >
                <input name="id" type="hidden" value={asset.id} />
                <Field>
                  <Label htmlFor={`filename-${asset.id}`}>Name</Label>
                  <Input
                    id={`filename-${asset.id}`}
                    name="filename"
                    defaultValue={asset.filename}
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor={`alt-${asset.id}`}>Alt Text</Label>
                  <Input
                    id={`alt-${asset.id}`}
                    name="altText"
                    defaultValue={asset.altText ?? ""}
                  />
                </Field>
                <Field>
                  <Label htmlFor={`tags-${asset.id}`}>Tags</Label>
                  <Input
                    id={`tags-${asset.id}`}
                    name="tags"
                    defaultValue={tagsText(asset.tags)}
                  />
                </Field>
                <Field>
                  <Label htmlFor={`folder-${asset.id}`}>Folder</Label>
                  <Select
                    id={`folder-${asset.id}`}
                    name="folderId"
                    defaultValue={asset.folderId ?? ""}
                  >
                    <option value="">No folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit">Save</Button>
              </ActionFeedbackForm>
              <div className="flex flex-wrap gap-2">
                <ActionFeedbackForm
                  action={duplicateMediaAction}
                  loadingMessage="A duplicar media..."
                  successMessage="Media duplicada."
                >
                  <input name="id" type="hidden" value={asset.id} />
                  <Button type="submit" variant="outline">
                    Duplicate
                  </Button>
                </ActionFeedbackForm>
                {canDelete ? (
                  <ConfirmActionForm
                    action={deleteMediaAction}
                    title="Eliminar media?"
                    description="Este ficheiro deixa de aparecer na biblioteca."
                    confirmLabel="Eliminar"
                    loadingMessage="A eliminar media..."
                    successMessage="Media eliminada."
                  >
                    <input name="id" type="hidden" value={asset.id} />
                    <Button type="submit" variant="destructive">
                      Delete
                    </Button>
                  </ConfirmActionForm>
                ) : null}
              </div>
            </div>
          ) : null}
        </Card>
      ))}
    </Grid>
  );
}
