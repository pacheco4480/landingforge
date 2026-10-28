import { z } from "zod";

import { containsSecretMaterial } from "@/features/exports/services/client-package-audit";
import type { ClientRuntimePayload } from "@/features/exports/client-runtime/contracts";
import {
  validateProjectSourceSnapshot,
  type ProjectSourceSnapshot,
} from "@/features/exports/services/project-source-snapshot";

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const safeColorSchema = z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
const safeFontSchema = z.string().min(1).max(80).regex(/^[\p{L}\p{N} ,.'-]+$/u);
const safeRadiusSchema = z.string().min(1).max(40).regex(/^[\p{L}\p{N} .%-]+$/u);

const publicThemeSchema = z
  .object({
    primaryColor: safeColorSchema,
    secondaryColor: safeColorSchema,
    accentColor: safeColorSchema,
    backgroundColor: safeColorSchema,
    surfaceColor: safeColorSchema,
    textPrimaryColor: safeColorSchema,
    textSecondaryColor: safeColorSchema,
    headingFont: safeFontSchema,
    bodyFont: safeFontSchema,
    borderRadius: safeRadiusSchema,
  })
  .strict();

const publicSectionSchema = z
  .object({
    sectionKey: z.string(),
    sectionType: z.string(),
    name: z.string(),
    sortOrder: z.number().int(),
    content: jsonValueSchema,
    settings: jsonValueSchema,
  })
  .strict();

const publicFormFieldSchema = z
  .object({
    label: z.string(),
    name: z.string(),
    type: z.string(),
    placeholder: z.string().nullable(),
    helpText: z.string().nullable(),
    defaultValue: z.string().nullable(),
    options: jsonValueSchema,
    validation: jsonValueSchema,
    conditionalLogic: jsonValueSchema,
    isRequired: z.boolean(),
  })
  .strict();

const publicFormSchema = z
  .object({
    name: z.string(),
    key: z.string(),
    type: z.string(),
    successMessage: z.string(),
    errorMessage: z.string(),
    gdprConsentRequired: z.boolean().optional(),
    gdprConsentLabel: z.string().optional(),
    gdprConsentVersion: z.string().optional(),
    fields: z.array(publicFormFieldSchema),
  })
  .strict();

const publicSeoSchema = z
  .object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    keywords: z.string().nullable(),
    ogTitle: z.string().nullable(),
    ogDescription: z.string().nullable(),
    twitterCardType: z.string().nullable(),
    robotsIndex: z.boolean(),
    robotsFollow: z.boolean(),
  })
  .strict();

export const clientRuntimePayloadSchema = z
  .object({
    format: z.literal("landingforge-client-runtime"),
    formatVersion: z.literal(1),
    templateVersion: z.string().min(1),
    templateKey: z.string().min(1),
    variantKey: z.string().min(1),
    page: z
      .object({
        title: z.string(),
        slug: z.string(),
        theme: publicThemeSchema,
        sections: z.array(publicSectionSchema),
        forms: z.array(publicFormSchema),
        seo: publicSeoSchema.nullable(),
      })
      .strict(),
  })
  .strict();

export type { ClientRuntimePayload };

const privateContentKeyPattern =
  /(?:^|[_-])(?:adminonly|internal(?:notes?|metadata)?|privatenotes?|clientid|projectid|tenantid|ownerid|recipient(?:email)?|submissionemail|secret|token|password|api[_-]?key|auth|databaseurl|cronsecret)(?:$|[_-])/i;

function assertNoPrivateContentKeys(value: unknown, path = "page") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateContentKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if (privateContentKeyPattern.test(key)) {
      throw new Error(`O campo ${path}.${key} é interno e não pode integrar o runtime público.`);
    }
    assertNoPrivateContentKeys(nestedValue, `${path}.${key}`);
  }
}

export function buildClientRuntimePayload(snapshotInput: ProjectSourceSnapshot, expectedChecksum?: string): ClientRuntimePayload {
  const snapshot = validateProjectSourceSnapshot(snapshotInput, expectedChecksum);
  if (!snapshot.templateKey || !snapshot.variantKey || !snapshot.page.theme) {
    throw new Error("O snapshot não contém template, variante e tema necessários ao runtime público.");
  }

  const payload = {
    format: "landingforge-client-runtime" as const,
    formatVersion: 1 as const,
    templateVersion: snapshot.templateVersion,
    templateKey: snapshot.templateKey,
    variantKey: snapshot.variantKey,
    page: {
      title: snapshot.page.title,
      slug: snapshot.page.slug,
      theme: {
        primaryColor: snapshot.page.theme.primaryColor,
        secondaryColor: snapshot.page.theme.secondaryColor,
        accentColor: snapshot.page.theme.accentColor,
        backgroundColor: snapshot.page.theme.backgroundColor,
        surfaceColor: snapshot.page.theme.surfaceColor,
        textPrimaryColor: snapshot.page.theme.textPrimaryColor,
        textSecondaryColor: snapshot.page.theme.textSecondaryColor,
        headingFont: snapshot.page.theme.headingFont,
        bodyFont: snapshot.page.theme.bodyFont,
        borderRadius: snapshot.page.theme.borderRadius,
      },
      sections: snapshot.page.sections
        .filter((section) => section.isVisible)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map(({ sectionKey, sectionType, name, sortOrder, content, settings }) => ({
          sectionKey,
          sectionType,
          name,
          sortOrder,
          content,
          settings,
        })),
      forms: snapshot.page.forms.map((form) => ({
        name: form.name,
        key: form.key,
        type: form.type,
        successMessage: form.successMessage,
        errorMessage: form.errorMessage,
        gdprConsentRequired: form.gdprConsentRequired,
        gdprConsentLabel: form.gdprConsentLabel,
        gdprConsentVersion: form.gdprConsentVersion,
        fields: form.fields
          .filter((field) => field.isVisible)
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((field) => ({
            label: field.label,
            name: field.name,
            type: field.type,
            placeholder: field.placeholder,
            helpText: field.helpText,
            defaultValue: field.defaultValue,
            options: field.options,
            validation: field.validation,
            conditionalLogic: field.conditionalLogic,
            isRequired: field.isRequired,
          })),
      })),
      seo: snapshot.page.seoSetting,
    },
  };

  const validated = clientRuntimePayloadSchema.parse(payload);
  assertNoPrivateContentKeys(validated.page);
  if (containsSecretMaterial(JSON.stringify(validated))) {
    throw new Error("O conteúdo público contém material com aspeto de credencial; a preparação foi bloqueada.");
  }

  return validated;
}
