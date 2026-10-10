import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";

export function MediaSearch({ query }: { query: string }) {
  return (
    <form className="flex flex-col gap-3 md:flex-row" action="/media">
      <Field className="flex-1">
        <Label htmlFor="q">Search by name, type or tag</Label>
        <Input id="q" name="q" type="search" defaultValue={query} />
      </Field>
      <div className="flex items-end">
        <Button type="submit" variant="outline">
          Search
        </Button>
      </div>
    </form>
  );
}
