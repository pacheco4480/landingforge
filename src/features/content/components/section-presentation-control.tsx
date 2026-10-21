"use client";

import * as React from "react";

import type { PresentationOption } from "@/features/public-renderer/section-presentation";

export function SectionPresentationControl({
  id,
  options,
  selectedValue,
  defaultValue,
}: {
  id: string;
  options: PresentationOption[];
  selectedValue: string;
  defaultValue: string;
}) {
  const [preview, setPreview] = React.useState(
    selectedValue === "__default" ? defaultValue : selectedValue,
  );
  const isFaq = options.some((option) => option.value === "accordion");

  return (
    <>
      <label className="text-sm font-medium" htmlFor={id}>
        Apresentação visual
      </label>
      <select
        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        defaultValue={selectedValue}
        id={id}
        name="presentationVariant"
        onChange={(event) =>
          setPreview(
            event.currentTarget.value === "__default"
              ? defaultValue
              : event.currentTarget.value,
          )
        }
      >
        <option value="__default">
          Predefinição do template (
          {options.find((option) => option.value === defaultValue)?.label})
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} — {option.description}
          </option>
        ))}
      </select>
      <p className="text-muted-foreground mt-1 text-xs">
        A escolha altera apenas a apresentação; conteúdo, campos e envio
        mantêm-se.
      </p>
      <div
        aria-label={`Pré-visualização: ${options.find((option) => option.value === preview)?.label ?? "predefinição"}`}
        className="border-border bg-muted/30 mt-3 flex min-h-14 items-center gap-2 rounded-md border p-3"
        role="img"
      >
        {isFaq ? (
          preview === "grouped" ? (
            <div className="grid w-full grid-cols-2 gap-2">
              <span className="border-border bg-background h-6 rounded-sm border" />
              <span className="border-border bg-background h-6 rounded-sm border" />
            </div>
          ) : preview === "editorial" ? (
            <div className="grid w-full gap-2">
              <span className="bg-foreground/20 h-1.5 w-1/3 rounded-sm" />
              <span className="bg-foreground/10 h-1.5 w-4/5 rounded-sm" />
              <span className="bg-foreground/10 h-1.5 w-2/3 rounded-sm" />
            </div>
          ) : (
            <div className="grid w-full gap-2">
              <span className="bg-foreground/15 h-1.5 w-4/5 rounded-sm" />
              <span className="bg-foreground/10 h-1.5 w-3/5 rounded-sm" />
            </div>
          )
        ) : (
          <>
            <span
              className={`bg-primary/20 h-9 rounded-sm ${preview === "compact" ? "w-1/4" : "w-1/3"}`}
            />
            <span
              className={`border-border bg-background h-9 flex-1 rounded-sm border ${preview === "editorial" ? "rounded-r-xl" : ""}`}
            />
          </>
        )}
      </div>
    </>
  );
}
