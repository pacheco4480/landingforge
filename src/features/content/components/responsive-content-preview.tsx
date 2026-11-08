"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

const viewports = [
  { key: "desktop", label: "Desktop", width: "100%", maxWidth: 1280 },
  { key: "tablet", label: "Tablet", width: 768, maxWidth: 768 },
  { key: "mobile", label: "Mobile", width: 390, maxWidth: 390 },
] as const;

export function ResponsiveContentPreview({ pageId }: { pageId: string }) {
  const [viewport, setViewport] = useState<(typeof viewports)[number]["key"]>("desktop");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const selected = viewports.find((item) => item.key === viewport) ?? viewports[0];

  return (
    <section aria-labelledby="content-preview-title" className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" id="content-preview-title">Pré-visualização da landing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mostra o conteúdo guardado. Guarda alterações antes de atualizar a pré-visualização.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div aria-label="Largura da pré-visualização" className="flex gap-2" role="group">
            {viewports.map((item) => (
              <button
                aria-pressed={viewport === item.key}
                className="min-h-10 rounded-md border border-border px-3 text-sm font-medium aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                key={item.key}
                onClick={() => setViewport(item.key)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button aria-label="Atualizar pré-visualização" onClick={() => setRefreshVersion((version) => version + 1)} size="icon" title="Atualizar pré-visualização" type="button" variant="outline">
            <RefreshCw aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </header>
      <div className="overflow-auto rounded-md border border-border bg-muted p-3">
        <iframe
          className="mx-auto min-h-[720px] border-0 bg-white shadow-sm"
          key={`${viewport}-${refreshVersion}`}
          src={`/content-preview/${pageId}?refresh=${refreshVersion}`}
          style={{ width: selected.width, maxWidth: selected.maxWidth }}
          title={`Pré-visualização da landing em ${selected.label.toLowerCase()}`}
        />
      </div>
    </section>
  );
}
