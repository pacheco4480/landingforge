"use client";

import { useState } from "react";

import { StructuredContentFields } from "@/features/exports/client-runtime/cms/components/structured-content-fields";
import { asRecord, editableContentKeys } from "@/features/exports/client-runtime/cms/content-editor-schema";

export function SectionContentFieldEditor({ sectionId, sectionType, initialContent }: { sectionId: string; sectionType: string; initialContent: unknown }) {
  const [content, setContent] = useState(() => asRecord(initialContent));
  const editableFields = editableContentKeys(initialContent);
  return <>
    <input type="hidden" id={`section-content-${sectionId}`} name="content" value={JSON.stringify(Object.fromEntries(editableFields.map((key) => [key, content[key]])))} />
    <StructuredContentFields idPrefix={`section-${sectionId}`} sectionType={sectionType} content={content} editableFields={editableFields} onChange={setContent} />
  </>;
}
