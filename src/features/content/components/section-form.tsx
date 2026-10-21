import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import {
  createSectionAction,
  updateSectionAction,
} from "@/features/content/actions/section.actions";
import { sectionTypeOptions } from "@/features/content/section-types";
import { SectionPresentationControl } from "@/features/content/components/section-presentation-control";
import {
  presentationOptions,
  resolvePresentation,
} from "@/features/public-renderer/section-presentation";

type SectionValue = {
  id: string;
  pageId: string;
  name: string;
  sectionType: string;
  content: unknown;
  settings: unknown;
};

function toJsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export function CreateSectionForm({ pageId }: { pageId: string }) {
  return (
    <Card>
      <form action={createSectionAction}>
        <input name="pageId" type="hidden" value={pageId} />
        <Grid className="md:grid-cols-[1fr_1fr_auto]">
          <Field>
            <Label htmlFor="new-section-name">Section name</Label>
            <Input id="new-section-name" name="name" required />
          </Field>
          <Field>
            <Label htmlFor="new-section-type">Section type</Label>
            <Select
              id="new-section-type"
              name="sectionType"
              defaultValue="hero"
            >
              {sectionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit">Add section</Button>
          </div>
        </Grid>
      </form>
    </Card>
  );
}

export function SectionForm({
  section,
  templateKey,
  templateVariantKey,
}: {
  section: SectionValue;
  templateKey?: string | null;
  templateVariantKey?: string | null;
}) {
  const options = presentationOptions(
    section.sectionType,
    templateKey,
    templateVariantKey,
  );
  const currentPresentation = resolvePresentation(
    section.sectionType,
    section.settings,
    templateKey,
    templateVariantKey,
  );

  return (
    <form action={updateSectionAction}>
      <input name="id" type="hidden" value={section.id} />
      <input name="pageId" type="hidden" value={section.pageId} />
      <Stack>
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor={`section-name-${section.id}`}>Name</Label>
            <Input
              id={`section-name-${section.id}`}
              name="name"
              defaultValue={section.name}
              required
            />
          </Field>
          <Field>
            <Label htmlFor={`section-type-${section.id}`}>Type</Label>
            <Select
              id={`section-type-${section.id}`}
              name="sectionType"
              defaultValue={section.sectionType}
            >
              {sectionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </Grid>
        <Field>
          <Label htmlFor={`section-content-${section.id}`}>Content JSON</Label>
          <Textarea
            className="font-mono text-xs"
            id={`section-content-${section.id}`}
            name="content"
            defaultValue={toJsonText(section.content)}
            required
          />
        </Field>
        <Field>
          {options.length ? (
            <>
              <SectionPresentationControl
                defaultValue={currentPresentation}
                id={`section-presentation-${section.id}`}
                options={options}
                selectedValue={
                  section.settings &&
                  typeof section.settings === "object" &&
                  !Array.isArray(section.settings) &&
                  typeof (section.settings as Record<string, unknown>)
                    .presentationVariant === "string" &&
                  options.some(
                    (option) =>
                      option.value ===
                      (section.settings as Record<string, unknown>)
                        .presentationVariant,
                  )
                    ? String(
                        (section.settings as Record<string, unknown>)
                          .presentationVariant,
                      )
                    : "__default"
                }
              />
            </>
          ) : null}
        </Field>
        <Field>
          <Label htmlFor={`section-settings-${section.id}`}>
            Settings JSON
          </Label>
          <Textarea
            className="font-mono text-xs"
            id={`section-settings-${section.id}`}
            name="settings"
            defaultValue={toJsonText(section.settings)}
            required
          />
        </Field>
        <div>
          <Button type="submit">Save section</Button>
        </div>
      </Stack>
    </form>
  );
}
