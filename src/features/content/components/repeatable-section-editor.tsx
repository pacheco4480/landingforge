"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { Card, Stack } from "@/components/ui/layout";

type ItemField = { key: string; label: string; multiline?: boolean; maxLength: number };
type Profile = { title: string; fields: ItemField[]; maxItems: number };
type ContentRecord = Record<string, unknown>;

const profiles: Record<string, Profile> = {
  faq: { title: "Perguntas frequentes", maxItems: 30, fields: [
    { key: "question", label: "Pergunta", maxLength: 180 },
    { key: "answer", label: "Resposta", multiline: true, maxLength: 1200 },
  ] },
  testimonials: { title: "Testemunhos", maxItems: 30, fields: [
    { key: "name", label: "Nome apresentado", maxLength: 100 },
    { key: "quote", label: "Testemunho", multiline: true, maxLength: 700 },
    { key: "context", label: "Contexto (opcional)", maxLength: 120 },
  ] },
  restaurant_reviews: { title: "Avaliações", maxItems: 30, fields: [
    { key: "name", label: "Nome apresentado", maxLength: 100 },
    { key: "quote", label: "Avaliação", multiline: true, maxLength: 700 },
    { key: "context", label: "Contexto (opcional)", maxLength: 120 },
  ] },
  restaurant_menu_highlights: { title: "Itens do menu", maxItems: 30, fields: [
    { key: "category", label: "Categoria", maxLength: 80 },
    { key: "title", label: "Nome do prato ou bebida", maxLength: 120 },
    { key: "description", label: "Descrição", multiline: true, maxLength: 500 },
    { key: "price", label: "Preço ou indicação (opcional)", maxLength: 40 },
  ] },
};

function profileFor(sectionType: string) {
  if (sectionType === "restaurant_reviews") return profiles.restaurant_reviews;
  if (sectionType === "restaurant_menu_highlights") return profiles.restaurant_menu_highlights;
  if (sectionType.endsWith("_faq") || sectionType === "faq") return profiles.faq;
  if (sectionType.endsWith("_testimonials") || sectionType === "testimonials") return profiles.testimonials;
  return null;
}

function asRecord(value: unknown): ContentRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ContentRecord : {};
}

function asItems(value: unknown): ContentRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function blankItem(profile: Profile): ContentRecord {
  return Object.fromEntries(profile.fields.map(({ key }) => [key, ""]));
}

export function RepeatableSectionEditor({
  sectionId,
  initialContent,
  sectionType,
}: {
  sectionId: string;
  initialContent: unknown;
  sectionType: string;
}) {
  const profile = profileFor(sectionType);
  const initialRecord = asRecord(initialContent);
  const [content, setContent] = useState<ContentRecord>(() =>
    profile && !Array.isArray(initialRecord.items)
      ? { ...initialRecord, items: [] }
      : initialRecord,
  );
  if (!profile) return null;

  const items = asItems(content.items);
  const updateItem = (index: number, key: string, value: string) => {
    setContent((current) => {
      const nextItems = asItems(current.items);
      nextItems[index] = { ...nextItems[index], [key]: value };
      return { ...current, items: nextItems };
    });
  };
  const moveItem = (index: number, direction: -1 | 1) => {
    setContent((current) => {
      const nextItems = asItems(current.items);
      const target = index + direction;
      [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
      return { ...current, items: nextItems };
    });
  };

  return (
    <div className="grid gap-5">
      <input type="hidden" name="content" value={JSON.stringify(content)} />
      <Stack>
        {typeof content.title === "string" ? (
          <Field>
            <Label htmlFor={`repeatable-title-${sectionId}`}>Título da secção</Label>
            <Input id={`repeatable-title-${sectionId}`} value={content.title} maxLength={180} onChange={(event) => setContent((current) => ({ ...current, title: event.target.value }))} />
          </Field>
        ) : null}
        {typeof content.text === "string" ? (
          <Field>
            <Label htmlFor={`repeatable-intro-${sectionId}`}>Texto de introdução</Label>
            <Textarea id={`repeatable-intro-${sectionId}`} value={content.text} maxLength={1000} onChange={(event) => setContent((current) => ({ ...current, text: event.target.value }))} />
          </Field>
        ) : null}
        <fieldset className="grid gap-4 border-t border-border pt-4">
          <legend className="px-1 text-sm font-semibold">{profile.title} ({items.length}/{profile.maxItems})</legend>
          {items.map((item, index) => (
            <Card className="grid gap-4 p-4" key={`${sectionId}-${index}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Item {index + 1}</h3>
                <div className="flex gap-2">
                  <Button aria-label={`Mover item ${index + 1} para cima`} disabled={index === 0} onClick={() => moveItem(index, -1)} size="icon" type="button" variant="outline"><ArrowUp aria-hidden="true" className="size-4" /></Button>
                  <Button aria-label={`Mover item ${index + 1} para baixo`} disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} size="icon" type="button" variant="outline"><ArrowDown aria-hidden="true" className="size-4" /></Button>
                  <Button aria-label={`Remover item ${index + 1}`} onClick={() => setContent((current) => ({ ...current, items: asItems(current.items).filter((_, itemIndex) => itemIndex !== index) }))} size="icon" type="button" variant="destructive"><Trash2 aria-hidden="true" className="size-4" /></Button>
                </div>
              </div>
              {profile.fields.map((field) => {
                const id = `repeatable-${sectionId}-${index}-${field.key}`;
                const value = typeof item[field.key] === "string" ? item[field.key] as string : "";
                return (
                  <Field key={field.key}>
                    <Label htmlFor={id}>{field.label}</Label>
                    {field.multiline ? <Textarea id={id} maxLength={field.maxLength} required={field.key !== "context"} value={value} onChange={(event) => updateItem(index, field.key, event.target.value)} /> : <Input id={id} maxLength={field.maxLength} required={field.key !== "context" && field.key !== "price"} value={value} onChange={(event) => updateItem(index, field.key, event.target.value)} />}
                    <p className="text-xs text-muted-foreground">{value.length}/{field.maxLength} caracteres</p>
                  </Field>
                );
              })}
            </Card>
          ))}
          {items.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não existem itens nesta lista.</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={items.length >= profile.maxItems} onClick={() => setContent((current) => ({ ...current, items: [...asItems(current.items), blankItem(profile)] }))} type="button" variant="outline"><Plus aria-hidden="true" className="size-4" />Adicionar item</Button>
            {items.length >= profile.maxItems ? <p role="status" className="text-sm text-muted-foreground">Limite atingido: esta secção apresenta até {profile.maxItems} itens.</p> : null}
          </div>
        </fieldset>
      </Stack>
    </div>
  );
}
