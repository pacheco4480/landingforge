"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";

import { itemText } from "@/features/public-renderer/components/section-utils";

export function GymModernGalleryClient({
  entries,
}: {
  entries: Record<string, unknown>[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const imageEntries = entries.filter((entry) => itemText(entry, "image"));

  function moveGallery(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.78, 280),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  if (imageEntries.length === 0) return null;

  return (
    <div className="gym-modern-gallery">
      {imageEntries.length > 1 ? (
        <div className="gym-modern-gallery__controls">
          <button
            aria-label="Deslizar galeria para a esquerda"
            onClick={() => moveGallery(-1)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Deslizar galeria para a direita"
            onClick={() => moveGallery(1)}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      ) : null}
      <div
        aria-label="Fotografias do espaço de treino"
        className="gym-modern-gallery__track"
        ref={trackRef}
        role="region"
        tabIndex={0}
      >
        {imageEntries.map((entry, index) => {
          const title = itemText(entry, "title", `Espaço de treino ${index + 1}`);
          const image = itemText(entry, "image");
          return (
            <figure className="gym-modern-gallery__item" key={`${title}-${index}`}>
              <div className="gym-modern-gallery__photo">
                {image ? (
                  <Image
                    alt={itemText(entry, "imageAlt", title)}
                    className="gym-modern-gallery__image"
                    fill
                    sizes="(min-width: 1200px) 54vw, 86vw"
                    src={image}
                    style={{ objectPosition: itemText(entry, "imagePosition", "center") }}
                    unoptimized
                  />
                ) : null}
                <span className="gym-modern-gallery__count">{String(index + 1).padStart(2, "0")} / {String(entries.length).padStart(2, "0")}</span>
              </div>
              <figcaption>{title}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
