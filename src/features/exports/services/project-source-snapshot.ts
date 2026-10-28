import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { getTemplateDefinition } from "@/features/public-renderer/template-registry";
import { z } from "zod";

type JsonValue = Prisma.JsonValue;

type SnapshotPage = {
  id: string;
  title: string;
  slug: string;
  template: { key: string } | null;
  templateVariant: { key: string } | null;
  theme: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textPrimaryColor: string;
    textSecondaryColor: string;
    headingFont: string;
    bodyFont: string;
    borderRadius: string;
    shadowStyle: string;
    settings: JsonValue;
  } | null;
  sections: Array<{
    sectionKey: string;
    sectionType: string;
    name: string;
    sortOrder: number;
    isVisible: boolean;
    content: JsonValue;
    settings: JsonValue;
  }>;
  forms: Array<{
    name: string;
    key: string;
    type: string;
    successMessage: string;
    errorMessage: string;
    gdprConsentRequired?: boolean;
    gdprConsentLabel?: string;
    gdprConsentVersion?: string;
    fields: Array<{
      label: string;
      name: string;
      type: string;
      placeholder: string | null;
      helpText: string | null;
      defaultValue: string | null;
      options: JsonValue;
      validation: JsonValue;
      conditionalLogic: JsonValue;
      sortOrder: number;
      isRequired: boolean;
      isVisible: boolean;
    }>;
  }>;
  seoSetting: {
    metaTitle: string;
    metaDescription: string;
    keywords: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    twitterCardType: string | null;
    robotsIndex: boolean;
    robotsFollow: boolean;
  } | null;
};

export type ProjectSourceSnapshot = {
  formatVersion: 1;
  templateVersion: string;
  sourcePageId: string;
  templateKey: string | null;
  variantKey: string | null;
  page: {
    title: string;
    slug: string;
    theme: NonNullable<SnapshotPage["theme"]> | null;
      sections: SnapshotPage["sections"];
      forms: SnapshotPage["forms"];
      seoSetting: SnapshotPage["seoSetting"];
  };
  capabilities: {
    sectionTypes: string[];
    sections: Array<{ key: string; type: string; editableFields: string[] }>;
    forms: Array<{ key: string; fields: string[] }>;
  };
};

const TEMPLATE_RENDERER_VERSION = "1.0.0";
const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const sourceSnapshotSchema = z.object({
  formatVersion: z.literal(1),
  templateVersion: z.string().min(1),
  sourcePageId: z.string().min(1),
  templateKey: z.string().min(1),
  variantKey: z.string().min(1).nullable(),
  page: z.object({
    title: z.string(),
    slug: z.string(),
    theme: z.object({
      name: z.string(),
      primaryColor: z.string(),
      secondaryColor: z.string(),
      accentColor: z.string(),
      backgroundColor: z.string(),
      surfaceColor: z.string(),
      textPrimaryColor: z.string(),
      textSecondaryColor: z.string(),
      headingFont: z.string(),
      bodyFont: z.string(),
      borderRadius: z.string(),
      shadowStyle: z.string(),
      settings: jsonValueSchema,
    }).strict().nullable(),
    sections: z.array(z.object({
      sectionKey: z.string().min(1),
      sectionType: z.string().min(1),
      name: z.string(),
      sortOrder: z.number().int(),
      isVisible: z.boolean(),
      content: jsonValueSchema,
      settings: jsonValueSchema,
    }).strict()),
    forms: z.array(z.object({
      name: z.string(),
      key: z.string().min(1),
      type: z.string().min(1),
      successMessage: z.string(),
      errorMessage: z.string(),
      gdprConsentRequired: z.boolean().optional(),
      gdprConsentLabel: z.string().optional(),
      gdprConsentVersion: z.string().optional(),
      fields: z.array(z.object({
        label: z.string(),
        name: z.string().min(1),
        type: z.string().min(1),
        placeholder: z.string().nullable(),
        helpText: z.string().nullable(),
        defaultValue: z.string().nullable(),
        options: jsonValueSchema,
        validation: jsonValueSchema,
        conditionalLogic: jsonValueSchema,
        sortOrder: z.number().int(),
        isRequired: z.boolean(),
        isVisible: z.boolean(),
      }).strict()),
    }).strict()),
    seoSetting: z.object({
      metaTitle: z.string(),
      metaDescription: z.string(),
      keywords: z.string().nullable(),
      ogTitle: z.string().nullable(),
      ogDescription: z.string().nullable(),
      twitterCardType: z.string().nullable(),
      robotsIndex: z.boolean(),
      robotsFollow: z.boolean(),
    }).strict().nullable(),
  }).strict(),
  capabilities: z.object({
    sectionTypes: z.array(z.string()),
    sections: z.array(z.object({
      key: z.string().min(1),
      type: z.string().min(1),
      editableFields: z.array(z.string()),
    }).strict()),
    forms: z.array(z.object({
      key: z.string().min(1),
      fields: z.array(z.string()),
    }).strict()),
  }).strict(),
}).strict();

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("O snapshot contém um valor que não pertence ao contrato JSON.");
  return encoded;
}

function snapshotChecksum(snapshot: ProjectSourceSnapshot) {
  return createHash("sha256").update(canonicalJson(snapshot)).digest("hex");
}

export function getProjectSourceSnapshotChecksum(snapshot: ProjectSourceSnapshot) {
  return snapshotChecksum(snapshot);
}

function assertUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`O snapshot contém ${label} duplicados.`);
  }
}

export function validateProjectSourceSnapshot(value: unknown, expectedChecksum?: string) {
  const snapshot = sourceSnapshotSchema.parse(value) as unknown as ProjectSourceSnapshot;
  const templateDefinition = getTemplateDefinition(snapshot.templateKey);
  if (!templateDefinition) {
    throw new Error("O snapshot não referencia um template declarado no registry.");
  }

  const expectedTemplateVersion = `${snapshot.templateKey}/${snapshot.variantKey ?? "default"}@${TEMPLATE_RENDERER_VERSION}`;
  if (snapshot.templateVersion !== expectedTemplateVersion) {
    throw new Error("A versão do template no snapshot não corresponde ao contrato ativo.");
  }

  const sectionKeys = snapshot.page.sections.map(({ sectionKey }) => sectionKey);
  const formKeys = snapshot.page.forms.map(({ key }) => key);
  assertUnique(sectionKeys, "chaves de secção");
  assertUnique(formKeys, "chaves de formulário");

  const unsupportedSections = snapshot.page.sections
    .filter(({ sectionType }) => !templateDefinition.supportedSections.includes(sectionType))
    .map(({ sectionType }) => sectionType);
  if (unsupportedSections.length) {
    throw new Error(`O snapshot contém secções não suportadas: ${[...new Set(unsupportedSections)].join(", ")}.`);
  }

  const expectedSectionTypes = [...new Set(snapshot.page.sections.map(({ sectionType }) => sectionType))];
  const expectedSections = snapshot.page.sections.map((section) => ({
    key: section.sectionKey,
    type: section.sectionType,
    editableFields:
      section.content && typeof section.content === "object" && !Array.isArray(section.content)
        ? Object.keys(section.content).sort()
        : [],
  }));
  const expectedForms = snapshot.page.forms.map((form) => ({
    key: form.key,
    fields: form.fields.map(({ name }) => name),
  }));
  if (
    canonicalJson(snapshot.capabilities.sectionTypes) !== canonicalJson(expectedSectionTypes) ||
    canonicalJson(snapshot.capabilities.sections) !== canonicalJson(expectedSections) ||
    canonicalJson(snapshot.capabilities.forms) !== canonicalJson(expectedForms)
  ) {
    throw new Error("O manifesto de capacidades não corresponde ao conteúdo do snapshot.");
  }

  if (expectedChecksum !== undefined) {
    if (!/^[a-f0-9]{64}$/i.test(expectedChecksum) || snapshotChecksum(snapshot) !== expectedChecksum.toLowerCase()) {
      throw new Error("O checksum do snapshot não corresponde ao conteúdo recebido.");
    }
  }

  return snapshot;
}

export function validateHistoricalProjectSourceSnapshot(value: unknown, expectedChecksum: string) {
  const snapshot = sourceSnapshotSchema.parse(value) as unknown as ProjectSourceSnapshot;
  if (!/^[a-f0-9]{64}$/i.test(expectedChecksum) || snapshotChecksum(snapshot) !== expectedChecksum.toLowerCase()) {
    throw new Error("O checksum do snapshot histórico não corresponde ao conteúdo recebido.");
  }
  assertUnique(snapshot.page.sections.map(({ sectionKey }) => sectionKey), "chaves de secção");
  assertUnique(snapshot.page.forms.map(({ key }) => key), "chaves de formulário");
  return snapshot;
}

function stableValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key] ?? null)]),
    );
  }
  return value;
}

export function buildProjectSourceSnapshot(page: SnapshotPage) {
  const templateKey = page.template?.key ?? null;
  const variantKey = page.templateVariant?.key ?? null;
  const templateDefinition = getTemplateDefinition(templateKey);
  if (!templateDefinition) {
    throw new Error("O template selecionado não tem uma definição de secções exportável.");
  }
  const unsupportedSections = page.sections
    .filter((section) => !templateDefinition.supportedSections.includes(section.sectionType))
    .map((section) => section.sectionType);
  if (unsupportedSections.length) {
    throw new Error(
      `O template não declara suporte para as secções: ${[...new Set(unsupportedSections)].join(", ")}.`,
    );
  }
  const templateVersion = `${templateKey ?? "unknown"}/${variantKey ?? "default"}@${TEMPLATE_RENDERER_VERSION}`;
  const snapshot: ProjectSourceSnapshot = {
    formatVersion: 1,
    templateVersion,
    sourcePageId: page.id,
    templateKey,
    variantKey,
    page: {
      title: page.title,
      slug: page.slug,
      theme: page.theme
        ? {
            name: page.theme.name,
            primaryColor: page.theme.primaryColor,
            secondaryColor: page.theme.secondaryColor,
            accentColor: page.theme.accentColor,
            backgroundColor: page.theme.backgroundColor,
            surfaceColor: page.theme.surfaceColor,
            textPrimaryColor: page.theme.textPrimaryColor,
            textSecondaryColor: page.theme.textSecondaryColor,
            headingFont: page.theme.headingFont,
            bodyFont: page.theme.bodyFont,
            borderRadius: page.theme.borderRadius,
            shadowStyle: page.theme.shadowStyle,
            settings: stableValue(page.theme.settings),
          }
        : null,
      sections: page.sections.map(({ sectionKey, sectionType, name, sortOrder, isVisible, content, settings }) => ({
        sectionKey,
        sectionType,
        name,
        sortOrder,
        isVisible,
        content: stableValue(content),
        settings: stableValue(settings),
      })),
      forms: page.forms.map((form) => ({
        name: form.name,
        key: form.key,
        type: form.type,
        successMessage: form.successMessage,
        errorMessage: form.errorMessage,
        ...(typeof form.gdprConsentRequired === "boolean" && { gdprConsentRequired: form.gdprConsentRequired }),
        ...(typeof form.gdprConsentLabel === "string" && { gdprConsentLabel: form.gdprConsentLabel }),
        ...(typeof form.gdprConsentVersion === "string" && { gdprConsentVersion: form.gdprConsentVersion }),
        fields: form.fields.map((field) => ({
          label: field.label,
          name: field.name,
          type: field.type,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          options: field.options === null ? null : stableValue(field.options),
          validation: field.validation === null ? null : stableValue(field.validation),
          conditionalLogic: field.conditionalLogic === null ? null : stableValue(field.conditionalLogic),
          sortOrder: field.sortOrder,
          isRequired: field.isRequired,
          isVisible: field.isVisible,
        })),
      })),
      seoSetting: page.seoSetting
        ? {
            metaTitle: page.seoSetting.metaTitle,
            metaDescription: page.seoSetting.metaDescription,
            keywords: page.seoSetting.keywords,
            ogTitle: page.seoSetting.ogTitle,
            ogDescription: page.seoSetting.ogDescription,
            twitterCardType: page.seoSetting.twitterCardType,
            robotsIndex: page.seoSetting.robotsIndex,
            robotsFollow: page.seoSetting.robotsFollow,
          }
        : null,
    },
    capabilities: {
      sectionTypes: [...new Set(page.sections.map((section) => section.sectionType))],
      sections: page.sections.map((section) => ({
        key: section.sectionKey,
        type: section.sectionType,
        editableFields:
          section.content && typeof section.content === "object" && !Array.isArray(section.content)
            ? Object.keys(section.content).sort()
            : [],
      })),
      forms: page.forms.map((form) => ({
        key: form.key,
        fields: form.fields.map((field) => field.name),
      })),
    },
  };

  const validatedSnapshot = validateProjectSourceSnapshot(snapshot);
  return {
    snapshot: validatedSnapshot,
    templateVersion,
    checksum: snapshotChecksum(validatedSnapshot),
  };
}

export function overrideProjectSourceSnapshotSlug(
  built: ReturnType<typeof buildProjectSourceSnapshot>,
  slug: string,
) {
  const snapshot = validateProjectSourceSnapshot({
    ...built.snapshot,
    page: { ...built.snapshot.page, slug },
  });
  return { ...built, snapshot, checksum: snapshotChecksum(snapshot) };
}
