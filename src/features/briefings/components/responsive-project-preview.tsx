"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";

import { Button } from "@/components/ui/button";

export const projectPreviewViewports = [
  { key: "desktop", label: "Desktop", width: 1440, height: 900, icon: Monitor },
  { key: "tablet", label: "Tablet", width: 768, height: 1024, icon: Tablet },
  { key: "mobile", label: "Telemóvel", width: 390, height: 844, icon: Smartphone },
] as const;

type PreviewViewport = (typeof projectPreviewViewports)[number];

export function ResponsiveProjectPreview({ canvasUrl }: { canvasUrl: string }) {
  const [viewport, setViewport] = useState<PreviewViewport>(projectPreviewViewports[0]);

  return (
    <div className="grid gap-3">
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Largura da pré-visualização"
      >
        {projectPreviewViewports.map((option) => {
          const Icon = option.icon;
          const selected = option.key === viewport.key;

          return (
            <Button
              key={option.key}
              type="button"
              variant={selected ? "secondary" : "outline"}
              aria-pressed={selected}
              onClick={() => setViewport(option)}
            >
              <Icon aria-hidden="true" className="size-4" />
              {option.label}
            </Button>
          );
        })}
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {viewport.width} × {viewport.height} px
        </span>
      </div>
      <div className="overflow-auto bg-muted p-3" aria-label={`Pré-visualização ${viewport.label}`}>
        <iframe
          key={viewport.key}
          src={canvasUrl}
          title={`Pré-visualização da landing em ${viewport.label.toLowerCase()}`}
          width={viewport.width}
          height={viewport.height}
          referrerPolicy="no-referrer"
          className="block border-0 bg-white"
          style={{ width: viewport.width, height: viewport.height }}
        />
      </div>
    </div>
  );
}
