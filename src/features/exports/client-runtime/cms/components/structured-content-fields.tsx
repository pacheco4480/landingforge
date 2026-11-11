"use client";

import { getContentCollections, getContentFields, getNewCollectionItem, parseNumericFieldValue, type ContentRecord } from "../content-editor-schema";

export function StructuredContentFields({
  sectionType,
  idPrefix,
  content,
  editableFields,
  disabled = false,
  onChange,
}: {
  sectionType: string;
  idPrefix: string;
  content: ContentRecord;
  editableFields: string[];
  disabled?: boolean;
  onChange: (content: ContentRecord) => void;
}) {
  const fields = getContentFields(content, editableFields);
  const collections = getContentCollections(sectionType, content, editableFields);
  const hidden = editableFields.filter((key) => !fields.some((field) => field.key === key) && !collections.some((collection) => collection.key === key));

  return (
    <div className="grid min-w-0 gap-4">
      {fields.map((field) => {
        const value = content[field.key];
        const control = field.kind === "long-text"
          ? <textarea aria-label={field.label} aria-describedby={`${idPrefix}-${field.key}-help`} className="min-h-24 w-full rounded-sm border border-input bg-background p-3" maxLength={field.maxLength} required={!field.optional} value={typeof value === "string" ? value : ""} onChange={(event) => onChange({ ...content, [field.key]: event.target.value })} disabled={disabled} />
          : <input aria-label={field.label} aria-describedby={`${idPrefix}-${field.key}-help`} className="min-h-10 w-full rounded-sm border border-input bg-background px-3" type={field.kind === "number" ? "number" : field.kind === "url" && /email/i.test(field.key) ? "email" : "text"} inputMode={field.kind === "url" && !/email/i.test(field.key) ? "url" : undefined} maxLength={field.kind === "number" ? undefined : field.maxLength} required={!field.optional} value={typeof value === "string" || typeof value === "number" ? value : ""} onChange={(event) => onChange({ ...content, [field.key]: field.kind === "number" ? parseNumericFieldValue(event.target.value) : event.target.value })} disabled={disabled} />;
        return <label className="grid min-w-0 gap-2 text-sm" key={field.key}><span className="font-medium">{field.label}</span>{control}<span className="text-xs text-muted-foreground" id={`${idPrefix}-${field.key}-help`}>{field.help} {field.kind === "number" ? "Indica um valor numérico." : `Limite: ${field.maxLength} caracteres.`}</span></label>;
      })}
      {collections.map((collection) => {
        const items = content[collection.key] as ContentRecord[];
        return <fieldset className="grid min-w-0 gap-4 border-t border-border pt-4" key={collection.key}>
          <legend className="px-1 text-sm font-semibold">{collection.label} ({items.length}/{collection.maxItems})</legend>
          {items.map((item, index) => <div className="grid min-w-0 gap-3 border border-border p-4" key={`${collection.key}-${index}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">Item {index + 1}</strong><div className="flex flex-wrap gap-2">
              <button aria-label={`Mover item ${index + 1} para cima`} className="min-h-10 border border-input px-3 disabled:opacity-50" disabled={disabled || index === 0} type="button" onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange({ ...content, [collection.key]: next }); }}>↑</button>
              <button aria-label={`Mover item ${index + 1} para baixo`} className="min-h-10 border border-input px-3 disabled:opacity-50" disabled={disabled || index === items.length - 1} type="button" onClick={() => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange({ ...content, [collection.key]: next }); }}>↓</button>
              <button aria-label={`Remover item ${index + 1}`} className="min-h-10 border border-input px-3 disabled:opacity-50" disabled={disabled} type="button" onClick={() => onChange({ ...content, [collection.key]: items.filter((_, itemIndex) => itemIndex !== index) })}>Remover</button>
            </div></div>
            {collection.fields.map((field) => {
              const helpId = `${idPrefix}-${collection.key}-${index}-${field.key}-help`;
              const accessibleName = `${field.label}, item ${index + 1}`;
              return <label className="grid min-w-0 gap-2 text-sm" key={field.key}><span className="font-medium">{field.label}</span>{field.kind === "long-text" ? <textarea aria-label={accessibleName} aria-describedby={helpId} className="min-h-24 w-full border border-input bg-background p-3" maxLength={field.maxLength} required={!field.optional} disabled={disabled} value={typeof item[field.key] === "string" ? item[field.key] as string : ""} onChange={(event) => { const next = [...items]; next[index] = { ...item, [field.key]: event.target.value }; onChange({ ...content, [collection.key]: next }); }} /> : <input aria-label={accessibleName} aria-describedby={helpId} className="min-h-10 w-full border border-input bg-background px-3" type={field.kind === "url" && /email/i.test(field.key) ? "email" : field.kind === "number" ? "number" : "text"} inputMode={field.kind === "url" && !/email/i.test(field.key) ? "url" : undefined} maxLength={field.kind === "number" ? undefined : field.maxLength} required={!field.optional} disabled={disabled} value={typeof item[field.key] === "string" || typeof item[field.key] === "number" ? String(item[field.key]) : ""} onChange={(event) => { const next = [...items]; next[index] = { ...item, [field.key]: field.kind === "number" ? parseNumericFieldValue(event.target.value) : event.target.value }; onChange({ ...content, [collection.key]: next }); }} />}<span className="text-xs text-muted-foreground" id={helpId}>{field.help} Limite: {field.maxLength} caracteres.</span></label>;
            })}
          </div>)}
          {items.length === 0 ? <p className="text-sm text-muted-foreground" role="status">Ainda não existem itens nesta lista.</p> : null}
          <button className="min-h-10 w-fit border border-input px-4 disabled:opacity-50" disabled={disabled || items.length >= collection.maxItems} type="button" onClick={() => onChange({ ...content, [collection.key]: [...items, getNewCollectionItem(sectionType, collection.key, items)] })}>Adicionar item</button>
        </fieldset>;
      })}
      {hidden.length ? <p className="text-sm text-muted-foreground">Alguns dados técnicos ou legados são preservados e não são editáveis neste CMS.</p> : null}
    </div>
  );
}
