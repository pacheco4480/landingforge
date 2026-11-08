"use client";

import { useState } from "react";

type RecordValue = Record<string, unknown>;
type SaveAction = (formData: FormData) => void | Promise<void>;

const fieldProfiles: Record<string, { label: string; max: number; multiline?: boolean }[]> = {
  faq: [{ label: "Pergunta", max: 180 }, { label: "Resposta", max: 1200, multiline: true }],
  testimonials: [{ label: "Nome apresentado", max: 100 }, { label: "Testemunho", max: 700, multiline: true }, { label: "Contexto (opcional)", max: 120 }],
  restaurant_reviews: [{ label: "Nome apresentado", max: 100 }, { label: "Avaliação", max: 700, multiline: true }, { label: "Contexto (opcional)", max: 120 }],
  restaurant_menu_highlights: [{ label: "Categoria", max: 80 }, { label: "Nome do prato ou bebida", max: 120 }, { label: "Descrição", max: 500, multiline: true }, { label: "Preço ou indicação (opcional)", max: 40 }],
};

function profileFor(sectionType: string) {
  if (sectionType === "restaurant_reviews") return { keys: ["name", "quote", "context"], fields: fieldProfiles.restaurant_reviews, maxItems: 30 };
  if (sectionType === "restaurant_menu_highlights") return { keys: ["category", "title", "description", "price"], fields: fieldProfiles.restaurant_menu_highlights, maxItems: 30 };
  if (sectionType === "faq" || sectionType.endsWith("_faq")) return { keys: ["question", "answer"], fields: fieldProfiles.faq, maxItems: 30 };
  if (sectionType === "testimonials" || sectionType.endsWith("_testimonials")) return { keys: ["name", "quote", "context"], fields: fieldProfiles.testimonials, maxItems: 30 };
  return null;
}

function record(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function itemList(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

export function repeatableCollectionLabel(sectionType: string) {
  if (sectionType.includes("menu")) return "Itens do menu";
  if (sectionType === "faq" || sectionType.endsWith("_faq")) return "Perguntas frequentes";
  if (sectionType === "restaurant_reviews") return "Avaliações";
  return "Testemunhos";
}

export function SectionContentEditor({
  pageId,
  section,
  editableFields,
  saveAction,
}: {
  pageId: string;
  section: { id: string; name: string; section_type: string; content: unknown };
  editableFields: string[];
  saveAction: SaveAction;
}) {
  const [content, setContent] = useState<RecordValue>(() => record(section.content));
  const profile = profileFor(section.section_type);
  const canEditItems = editableFields.includes("items") && Boolean(profile);
  const items = itemList(content.items);
  const patch = Object.fromEntries(editableFields.filter((key) => key in content).map((key) => [key, content[key]]));
  const updateItem = (index: number, key: string, value: string) => {
    setContent((current) => {
      const next = itemList(current.items);
      next[index] = { ...next[index], [key]: value };
      return { ...current, items: next };
    });
  };

  return (
    <form action={saveAction} className="grid gap-3 border p-4">
      <h2 className="font-semibold">{section.name} <span className="text-sm font-normal text-muted-foreground">· {section.section_type}</span></h2>
      <input type="hidden" name="pageId" value={pageId} />
      <input type="hidden" name="sectionId" value={section.id} />
      {canEditItems && profile ? (
        <>
          <input type="hidden" name="content" value={JSON.stringify({ ...patch, items: content.items })} />
          {editableFields.includes("title") && typeof content.title === "string" ? <label className="grid gap-2 text-sm">Título<input className="min-h-10 border px-3" maxLength={180} value={content.title} onChange={(event) => setContent((current) => ({ ...current, title: event.target.value }))} /></label> : null}
          {editableFields.includes("text") && typeof content.text === "string" ? <label className="grid gap-2 text-sm">Introdução<textarea className="min-h-24 border p-3" maxLength={1000} value={content.text} onChange={(event) => setContent((current) => ({ ...current, text: event.target.value }))} /></label> : null}
          <fieldset className="grid gap-4 border-t pt-4">
            <legend className="px-1 text-sm font-semibold">{repeatableCollectionLabel(section.section_type)} ({items.length}/{profile.maxItems})</legend>
            {items.map((item, index) => (
              <div className="grid gap-3 border p-4" key={`${section.id}-${index}`}>
                <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">Item {index + 1}</strong><div className="flex gap-2"><button aria-label={`Mover item ${index + 1} para cima`} className="min-h-10 border px-3 disabled:opacity-50" disabled={index === 0} onClick={() => setContent((current) => { const next = itemList(current.items); [next[index - 1], next[index]] = [next[index], next[index - 1]]; return { ...current, items: next }; })} type="button">↑</button><button aria-label={`Mover item ${index + 1} para baixo`} className="min-h-10 border px-3 disabled:opacity-50" disabled={index === items.length - 1} onClick={() => setContent((current) => { const next = itemList(current.items); [next[index + 1], next[index]] = [next[index], next[index + 1]]; return { ...current, items: next }; })} type="button">↓</button><button aria-label={`Remover item ${index + 1}`} className="min-h-10 border border-red-700 px-3 text-red-800" onClick={() => setContent((current) => ({ ...current, items: itemList(current.items).filter((_, itemIndex) => itemIndex !== index) }))} type="button">Remover</button></div></div>
                {profile.keys.map((key, fieldIndex) => {
                  const field = profile.fields[fieldIndex];
                  const value = typeof item[key] === "string" ? item[key] as string : "";
                  const required = !field.label.includes("opcional");
                  return <label className="grid gap-2 text-sm" key={key}>{field.label}{field.multiline ? <textarea className="min-h-24 border p-3" maxLength={field.max} required={required} value={value} onChange={(event) => updateItem(index, key, event.target.value)} /> : <input className="min-h-10 border px-3" maxLength={field.max} required={required} value={value} onChange={(event) => updateItem(index, key, event.target.value)} />}<span className="text-xs text-muted-foreground">{value.length}/{field.max} caracteres</span></label>;
                })}
              </div>
            ))}
            {items.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não existem itens nesta lista.</p> : null}
            <div className="flex flex-wrap items-center gap-3"><button className="min-h-10 border px-4 disabled:opacity-50" disabled={items.length >= profile.maxItems} onClick={() => setContent((current) => ({ ...current, items: [...itemList(current.items), Object.fromEntries(profile.keys.map((key) => [key, ""]))] }))} type="button">Adicionar item</button>{items.length >= profile.maxItems ? <p role="status" className="text-sm text-muted-foreground">Limite atingido: máximo de {profile.maxItems} itens nesta secção.</p> : null}</div>
          </fieldset>
        </>
      ) : (
        <label className="grid gap-2 text-sm">Campos editáveis (JSON)<textarea name="content" required rows={Math.min(18, Math.max(6, JSON.stringify(section.content).length / 90))} defaultValue={JSON.stringify(Object.fromEntries(editableFields.map((key) => [key, record(section.content)[key]])), null, 2)} className="min-h-40 w-full border p-3 font-mono text-xs" /></label>
      )}
      <button className="min-h-10 w-fit bg-primary px-4 text-primary-foreground" type="submit">Guardar secção</button>
    </form>
  );
}
