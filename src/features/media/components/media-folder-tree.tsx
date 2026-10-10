import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { Card, Grid } from "@/components/ui/layout";
import {
  createFolderAction,
  deleteFolderAction,
  renameFolderAction,
} from "@/features/media/actions/media.actions";

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  _count: { assets: number; children: number };
};

export function MediaFolderTree({ folders }: { folders: Folder[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Folders</h2>
      <form action={createFolderAction} className="mt-4">
        <Grid className="md:grid-cols-[1fr_220px_auto]">
          <Field>
            <Label htmlFor="folder-name">Folder name</Label>
            <Input id="folder-name" name="name" required />
          </Field>
          <Field>
            <Label htmlFor="parentId">Parent</Label>
            <Select id="parentId" name="parentId">
              <option value="">Root</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="outline">
              Create
            </Button>
          </div>
        </Grid>
      </form>
      <div className="mt-5 grid gap-3">
        {folders.map((folder) => (
          <div
            className="border-border grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto]"
            key={folder.id}
          >
            <div>
              <p className="font-medium">{folder.name}</p>
              <p className="text-muted-foreground text-sm">
                {folder._count.assets} assets, {folder._count.children} folders
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={renameFolderAction} className="flex gap-2">
                <input name="id" type="hidden" value={folder.id} />
                <Input
                  name="name"
                  defaultValue={folder.name}
                  aria-label={`Rename ${folder.name}`}
                />
                <Button type="submit" variant="outline">
                  Rename
                </Button>
              </form>
              <form action={deleteFolderAction}>
                <input name="id" type="hidden" value={folder.id} />
                <Button type="submit" variant="destructive">
                  Delete
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
