import type { ProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";

export type TemplateRebaseReport = {
  sourceTemplateVersion: string;
  targetTemplateVersion: string;
  addedSections: string[];
  changedSections: string[];
  removedSectionsPreserved: string[];
  addedForms: string[];
  changedForms: string[];
  removedFormsPreserved: string[];
  addedFields: string[];
  changedFields: string[];
  removedFieldsPreserved: string[];
  addedAssets: string[];
  changedAssets: string[];
  removedAssetsPreserved: string[];
  conflicts: string[];
};

export type FormFieldConflict = {
  formKey: string;
  fieldName: string;
  propertyPath: string[];
  replacesWholeField: boolean;
};

export type FormConflict = {
  formKey: string;
  property: string | null;
  replacesWholeForm: boolean;
};

const fieldProperties = new Set([
  "label",
  "type",
  "placeholder",
  "helpText",
  "defaultValue",
  "options",
  "validation",
  "conditionalLogic",
  "sortOrder",
  "isRequired",
  "isVisible",
]);

const formProperties = new Set([
  "name",
  "type",
  "successMessage",
  "errorMessage",
  "gdprConsentRequired",
  "gdprConsentLabel",
  "gdprConsentVersion",
  "fields",
]);

export function parseFormConflict(path: string): FormConflict | null {
  if (!path.startsWith("formulário.")) return null;
  const wholeForm = path.endsWith(" (tipo incompatível)");
  const segments = (wholeForm ? path.slice(0, -" (tipo incompatível)".length) : path).split(".");
  if (segments.length < 2 || segments[0] !== "formulário" || segments[2] === "campo") return null;
  const propertyPath = segments.slice(2);
  if (propertyPath.length > 1 || (propertyPath.length === 1 && !formProperties.has(propertyPath[0]))) return null;
  return {
    formKey: segments[1],
    property: propertyPath[0] ?? null,
    replacesWholeForm: wholeForm,
  };
}

export function parseFormFieldConflict(path: string): FormFieldConflict | null {
  const wholeField = path.endsWith(" (tipo incompatível)");
  const segments = (wholeField ? path.slice(0, -" (tipo incompatível)".length) : path).split(".");
  if (segments[0] !== "formulário" || segments[2] !== "campo" || segments.length < 4) return null;
  const propertyPath = segments.slice(4);
  if (propertyPath.length && !fieldProperties.has(propertyPath[0])) return null;
  if (propertyPath.some((segment) => !segment || segment.includes(" ") || ["__proto__", "constructor", "prototype"].includes(segment))) return null;
  return {
    formKey: segments[1],
    fieldName: segments[3],
    propertyPath,
    replacesWholeField: wholeField,
  };
}

const MISSING_FIELD_VALUE = Symbol("missing-field-value");

function valueAtPath(value: unknown, path: string[]): unknown | typeof MISSING_FIELD_VALUE {
  let current = value;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !(segment in current)) return MISSING_FIELD_VALUE;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function setPathValue(target: Record<string, unknown>, path: string[], value: unknown | typeof MISSING_FIELD_VALUE) {
  let current = target;
  for (const segment of path.slice(0, -1)) {
    const child = current[segment];
    if (!child || typeof child !== "object" || Array.isArray(child)) current[segment] = {};
    current = current[segment] as Record<string, unknown>;
  }
  const key = path.at(-1);
  if (!key) return;
  if (value === MISSING_FIELD_VALUE) delete current[key];
  else current[key] = value;
}

export function applyTemplateFieldConflict(
  currentField: Record<string, unknown>,
  templateField: Record<string, unknown>,
  conflict: FormFieldConflict,
) {
  if (conflict.replacesWholeField) return structuredClone(templateField);
  if (!conflict.propertyPath.length) return structuredClone(currentField);
  const updated = structuredClone(currentField);
  setPathValue(updated, conflict.propertyPath, valueAtPath(templateField, conflict.propertyPath));
  return updated;
}

const MISSING = Symbol("missing-json-value");
type MergeValue = unknown | typeof MISSING;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function same(left: MergeValue, right: MergeValue) {
  if (left === MISSING || right === MISSING) return left === right;
  return stable(left) === stable(right);
}

function isRecord(value: MergeValue): value is Record<string, MergeValue> {
  return value !== MISSING && value !== null && typeof value === "object" && !Array.isArray(value);
}

function collectAssetChanges(base: MergeValue, incoming: MergeValue, path: string, report: TemplateRebaseReport) {
  if (same(base, incoming)) return;
  if (base === MISSING && isRecord(incoming)) {
    for (const [key, value] of Object.entries(incoming)) {
      const nextPath = `${path}.${key}`;
      if (/image|photo|asset|media|logo|icon|poster|background/i.test(key)) report.addedAssets.push(nextPath);
      collectAssetChanges(MISSING, value, nextPath, report);
    }
    return;
  }
  if (incoming === MISSING && isRecord(base)) {
    for (const [key, value] of Object.entries(base)) {
      const nextPath = `${path}.${key}`;
      if (/image|photo|asset|media|logo|icon|poster|background/i.test(key)) report.removedAssetsPreserved.push(nextPath);
      collectAssetChanges(value, MISSING, nextPath, report);
    }
    return;
  }
  if (isRecord(base) && isRecord(incoming)) {
    for (const key of new Set([...Object.keys(base), ...Object.keys(incoming)])) {
      const oldValue = key in base ? base[key] : MISSING;
      const newValue = key in incoming ? incoming[key] : MISSING;
      const nextPath = `${path}.${key}`;
      if (/image|photo|asset|media|logo|icon|poster|background/i.test(key) && !same(oldValue, newValue)) {
        if (oldValue === MISSING) report.addedAssets.push(nextPath);
        else if (newValue === MISSING) report.removedAssetsPreserved.push(nextPath);
        else report.changedAssets.push(nextPath);
      }
      collectAssetChanges(oldValue, newValue, nextPath, report);
    }
  } else if (Array.isArray(base) && Array.isArray(incoming)) {
    const length = Math.max(base.length, incoming.length);
    for (let index = 0; index < length; index += 1) {
      collectAssetChanges(index < base.length ? base[index] : MISSING, index < incoming.length ? incoming[index] : MISSING, `${path}[${index}]`, report);
    }
  }
}

function mergeValue(base: MergeValue, current: MergeValue, incoming: MergeValue, path: string, conflicts: string[]): MergeValue {
  if (same(current, base)) return incoming;
  if (same(incoming, base) || same(current, incoming)) return current;
  if (isRecord(base) && isRecord(current) && isRecord(incoming)) {
    const merged: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(base), ...Object.keys(current), ...Object.keys(incoming)])) {
      const child = mergeValue(
        key in base ? base[key] : MISSING,
        key in current ? current[key] : MISSING,
        key in incoming ? incoming[key] : MISSING,
        `${path}.${key}`,
        conflicts,
      );
      if (child !== MISSING) merged[key] = child;
    }
    return merged;
  }
  conflicts.push(path);
  return current;
}

function indexBy<T>(values: T[], key: (value: T) => string) {
  return new Map(values.map((value) => [key(value), value]));
}

function mergeNamedCollection<T>(input: {
  base: T[];
  current: T[];
  incoming: T[];
  key: (value: T) => string;
  path: string;
  conflicts: string[];
  added: string[];
  changed: string[];
  removedPreserved: string[];
  keepType?: (current: T, incoming: T) => boolean;
}): T[] {
  const baseByKey = indexBy(input.base, input.key);
  const currentByKey = indexBy(input.current, input.key);
  const incomingByKey = indexBy(input.incoming, input.key);
  const result: T[] = [];

  for (const [key, next] of incomingByKey) {
    const base = baseByKey.get(key);
    const current = currentByKey.get(key);
    const itemPath = `${input.path}.${key}`;
    if (!base) {
      input.added.push(itemPath);
      if (current && !same(current, next)) input.conflicts.push(itemPath);
      result.push((current ?? next) as T);
      continue;
    }
    if (!current) {
      input.removedPreserved.push(itemPath);
      if (!same(base, next)) input.conflicts.push(itemPath);
      continue;
    }
    if (input.keepType && !input.keepType(current, next)) {
      input.conflicts.push(`${itemPath} (tipo incompatível)`);
      result.push(current);
      continue;
    }
    const merged = mergeValue(base, current, next, itemPath, input.conflicts);
    if (merged !== MISSING) {
      if (!same(base, next)) input.changed.push(itemPath);
      result.push(merged as T);
    }
  }

  for (const [key, current] of currentByKey) {
    if (incomingByKey.has(key)) continue;
    const base = baseByKey.get(key);
    input.removedPreserved.push(`${input.path}.${key}`);
    if (base && !same(base, current)) input.conflicts.push(`${input.path}.${key}`);
    result.push(current);
  }

  return result;
}

export function rebaseProjectSnapshot(
  base: ProjectSourceSnapshot,
  current: ProjectSourceSnapshot,
  incoming: ProjectSourceSnapshot,
) {
  if (base.templateKey !== incoming.templateKey || base.variantKey !== incoming.variantKey) {
    throw new Error("O rebase só pode ser feito entre versões do mesmo template e variante.");
  }
  if (current.templateKey !== base.templateKey || current.variantKey !== base.variantKey) {
    throw new Error("O projeto atual já usa outro template/variante; o rebase automático foi bloqueado.");
  }

  const report: TemplateRebaseReport = {
    sourceTemplateVersion: base.templateVersion,
    targetTemplateVersion: incoming.templateVersion,
    addedSections: [],
    changedSections: [],
    removedSectionsPreserved: [],
    addedForms: [],
    changedForms: [],
    removedFormsPreserved: [],
    addedFields: [],
    changedFields: [],
    removedFieldsPreserved: [],
    addedAssets: [],
    changedAssets: [],
    removedAssetsPreserved: [],
    conflicts: [],
  };

  const baseSections = indexBy(base.page.sections, (section) => section.sectionKey);
  const incomingSections = indexBy(incoming.page.sections, (section) => section.sectionKey);
  for (const [key, oldSection] of baseSections) {
    const nextSection = incomingSections.get(key);
    collectAssetChanges(oldSection, nextSection ?? MISSING, `secção.${key}`, report);
  }
  for (const [key, nextSection] of incomingSections) {
    if (!baseSections.has(key)) collectAssetChanges(MISSING, nextSection, `secção.${key}`, report);
  }

  const sections = mergeNamedCollection({
    base: base.page.sections,
    current: current.page.sections,
    incoming: incoming.page.sections,
    key: (section) => section.sectionKey,
    path: "secção",
    conflicts: report.conflicts,
    added: report.addedSections,
    changed: report.changedSections,
    removedPreserved: report.removedSectionsPreserved,
    keepType: (left, right) => left.sectionType === right.sectionType,
  });
  const baseForms = indexBy(base.page.forms, (form) => form.key);
  const currentForms = indexBy(current.page.forms, (form) => form.key);
  const incomingForms = indexBy(incoming.page.forms, (form) => form.key);
  const forms = mergeNamedCollection({
    base: base.page.forms,
    current: current.page.forms,
    incoming: incoming.page.forms,
    key: (form) => form.key,
    path: "formulário",
    conflicts: report.conflicts,
    added: report.addedForms,
    changed: report.changedForms,
    removedPreserved: report.removedFormsPreserved,
    keepType: (left, right) => left.type === right.type,
  }).map((form) => {
    const baseForm = baseForms.get(form.key);
    const currentForm = currentForms.get(form.key);
    const incomingForm = incomingForms.get(form.key);
    if (!baseForm || !currentForm || !incomingForm) return form;
    const fields = mergeNamedCollection({
      base: baseForm.fields,
      current: currentForm.fields,
      incoming: incomingForm.fields,
      key: (field) => field.name,
      path: `formulário.${form.key}.campo`,
      conflicts: report.conflicts,
      added: report.addedFields,
      changed: report.changedFields,
      removedPreserved: report.removedFieldsPreserved,
      keepType: (left, right) => left.type === right.type,
    });
    return { ...form, fields };
  });

  const theme = current.page.theme ?? incoming.page.theme;
  const seoSetting = current.page.seoSetting
    ? { ...current.page.seoSetting, robotsIndex: false, robotsFollow: false }
    : incoming.page.seoSetting
      ? { ...incoming.page.seoSetting, robotsIndex: false, robotsFollow: false }
      : null;

  return {
    snapshot: {
      ...incoming,
      page: {
        ...incoming.page,
        title: current.page.title,
        slug: current.page.slug,
        theme,
        sections: sections.sort((left, right) => left.sortOrder - right.sortOrder),
        forms,
        seoSetting,
      },
    } satisfies ProjectSourceSnapshot,
    report,
  };
}
