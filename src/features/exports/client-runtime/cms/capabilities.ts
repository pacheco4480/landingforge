import { z } from "zod";

import { clientCmsContentPatchSchema, type ClientCmsCapability } from "./contracts";
import { editableContentKeys } from "./content-editor-schema";

const sourceSectionSchema = z.object({
  sectionKey: z.string().min(1),
  sectionType: z.string().min(1),
  content: z.record(z.string(), z.unknown()),
}).passthrough();

const sourceCapabilitySchema = z.object({
  key: z.string().min(1),
  type: z.string().min(1),
  editableFields: z.array(z.string()),
}).strict();

const snapshotCapabilityInputSchema = z.object({
  templateVersion: z.string().min(1),
  templateKey: z.string().min(1),
  variantKey: z.string().min(1),
  page: z.object({ sections: z.array(sourceSectionSchema) }).passthrough(),
  capabilities: z.object({ sections: z.array(sourceCapabilitySchema) }).passthrough(),
}).passthrough();

const privateFieldPattern = /(?:password|secret|token|credential|database|tenant|project|internal|admin|recipient|auth)/i;

export function capabilitiesFromPinnedSnapshot(input: unknown): {
  templateKey: string;
  variantKey: string;
  templateVersion: string;
  capabilities: ClientCmsCapability[];
} {
  const snapshot = snapshotCapabilityInputSchema.parse(input);
  const actualSections = new Map(snapshot.page.sections.map((section) => [section.sectionKey, section]));
  const seen = new Set<string>();
  const capabilities = snapshot.capabilities.sections.map((declared) => {
    if (seen.has(declared.key)) throw new Error("O snapshot contém capacidades de secção duplicadas.");
    seen.add(declared.key);
    const actual = actualSections.get(declared.key);
    if (!actual || actual.sectionType !== declared.type) {
      throw new Error("As capacidades não correspondem às secções da versão fixada.");
    }
    const actualFields = editableContentKeys(actual.content);
    const declaredFields = [...new Set(declared.editableFields)].sort();
    const legacyFields = Object.keys(actual.content).sort();
    const matchesCurrent = actualFields.length === declaredFields.length && actualFields.every((field, index) => field === declaredFields[index]);
    const matchesLegacy = legacyFields.length === declaredFields.length && legacyFields.every((field, index) => field === declaredFields[index]);
    if (!matchesCurrent && !matchesLegacy) {
      throw new Error("Os campos editáveis não correspondem ao conteúdo do snapshot fixado.");
    }
    if (declaredFields.some((field) => privateFieldPattern.test(field))) {
      throw new Error("O snapshot contém campos internos que não podem ser expostos no CMS.");
    }
    if (!clientCmsContentPatchSchema.safeParse(actual.content).success) {
      throw new Error("O conteúdo inicial contém dados inválidos para o CMS cliente.");
    }
    return {
      sectionKey: declared.key,
      sectionType: declared.type,
      editableFields: actualFields,
    };
  });
  if (seen.size !== actualSections.size) throw new Error("O snapshot tem secções sem capacidade CMS declarada.");
  return {
    templateKey: snapshot.templateKey,
    variantKey: snapshot.variantKey,
    templateVersion: snapshot.templateVersion,
    capabilities,
  };
}
