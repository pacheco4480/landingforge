import { Alert } from "@/components/ui/feedback";
import { ActionFeedbackForm } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Card, Grid } from "@/components/ui/layout";
import { uploadMediaAction } from "@/features/media/actions/media.actions";
import { isSupabaseStorageConfigured } from "@/lib/storage/supabase-storage";

type Folder = { id: string; name: string };

export function MediaUploadForm({ folders }: { folders: Folder[] }) {
  const configured = isSupabaseStorageConfigured();

  return (
    <Card>
      {!configured ? (
        <Alert className="mb-4" tone="warning" title="Storage not configured">
          Add Supabase Storage environment variables before uploading files.
        </Alert>
      ) : null}
      <ActionFeedbackForm
        action={uploadMediaAction}
        loadingMessage="A carregar ficheiros..."
        successMessage="Upload concluido."
      >
        <Grid className="md:grid-cols-[1fr_220px_auto]">
          <Field>
            <Label htmlFor="files">Upload files</Label>
            <Input
              id="files"
              name="files"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.svg,.mp4,.webm,.pdf"
              disabled={!configured}
            />
            <p className="text-muted-foreground text-xs">
              Permitido: JPG, PNG, WebP, SVG, MP4, WebM e PDF. Ficheiros
              maiores que o limite configurado são rejeitados.
            </p>
          </Field>
          <Field>
            <Label htmlFor="folderId">Folder</Label>
            <Select id="folderId" name="folderId" disabled={!configured}>
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={!configured}>
              Upload
            </Button>
          </div>
        </Grid>
      </ActionFeedbackForm>
    </Card>
  );
}
