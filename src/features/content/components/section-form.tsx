import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import {
  createSectionAction,
  updateSectionAction,
} from "@/features/content/actions/section.actions";
import { sectionTypeLabel, sectionTypeOptions } from "@/features/content/section-types";
import { getTemplateDefinition } from "@/features/public-renderer/template-registry";
import { SectionPresentationControl } from "@/features/content/components/section-presentation-control";
import { SectionContentFieldEditor } from "@/features/content/components/section-content-field-editor";
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
            <Label htmlFor="new-section-name">Nome da secção</Label>
            <Input id="new-section-name" name="name" required />
          </Field>
          <Field>
            <Label htmlFor="new-section-type">Tipo de secção</Label>
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
            <Button type="submit">Adicionar secção</Button>
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
  const availableSectionTypes = Array.from(
    new Set([
      ...sectionTypeOptions.map((option) => option.value),
      ...(getTemplateDefinition(templateKey ?? null)?.supportedSections ?? []),
    ]),
  ).map((value) => ({
    value,
    label:
      sectionTypeOptions.find((option) => option.value === value)?.label ??
      sectionTypeLabel(value),
  }));

  return (
    <form action={updateSectionAction}>
      <input name="id" type="hidden" value={section.id} />
      <input name="pageId" type="hidden" value={section.pageId} />
      <Stack>
        <Grid className="md:grid-cols-2">
          <Field>
            <Label htmlFor={`section-name-${section.id}`}>Nome</Label>
            <Input
              id={`section-name-${section.id}`}
              name="name"
              defaultValue={section.name}
              required
            />
          </Field>
          <Field>
            <Label htmlFor={`section-type-${section.id}`}>Tipo de secção</Label>
            <Select
              id={`section-type-${section.id}`}
              name="sectionType"
              defaultValue={section.sectionType}
            >
              {availableSectionTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </Grid>
        <SectionContentFieldEditor
          initialContent={section.content}
          sectionId={section.id}
          sectionType={section.sectionType}
        />
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
            Definições (JSON)
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
          <Button type="submit">Guardar secção</Button>
        </div>
      </Stack>
    </form>
  );
}
