import type { Redirect } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-display";
import { Field, Input, Label, Select } from "@/components/ui/form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";
import {
  deleteRedirectAction,
  upsertRedirectAction,
} from "@/features/seo/actions/redirect.actions";

export function RedirectsManager({
  redirects,
  canWrite,
}: {
  redirects: Redirect[];
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redirects</CardTitle>
        <CardDescription>
          Foundation for 301 and 302 URL migration rules.
        </CardDescription>
      </CardHeader>
      {canWrite ? (
        <form action={upsertRedirectAction} className="mb-6 grid gap-4">
          <Grid className="md:grid-cols-[1fr_1fr_140px]">
            <Field>
              <Label htmlFor="fromPath">From</Label>
              <Input id="fromPath" name="fromPath" placeholder="/old-page" />
            </Field>
            <Field>
              <Label htmlFor="toPath">To</Label>
              <Input id="toPath" name="toPath" placeholder="/new-page" />
            </Field>
            <Field>
              <Label htmlFor="statusCode">Type</Label>
              <Select id="statusCode" name="statusCode" defaultValue="301">
                <option value="301">301</option>
                <option value="302">302</option>
              </Select>
            </Field>
          </Grid>
          <Button type="submit">Add redirect</Button>
        </form>
      ) : null}
      <DataTable
        columns={["From", "To", "Type", "Action"]}
        rows={redirects.map((redirect) => [
          redirect.fromPath,
          redirect.toPath,
          redirect.statusCode,
          canWrite ? (
            <form action={deleteRedirectAction} key={redirect.id}>
              <input name="id" type="hidden" value={redirect.id} />
              <Button type="submit" variant="destructive" size="sm">
                Delete
              </Button>
            </form>
          ) : (
            "Read only"
          ),
        ])}
      />
    </Card>
  );
}
