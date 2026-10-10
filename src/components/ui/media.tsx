import NextImage, { type ImageProps as NextImageProps } from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

export function Image({ className, alt, ...props }: NextImageProps) {
  return (
    <NextImage
      className={cn("bg-muted object-cover", className)}
      alt={alt}
      {...props}
    />
  );
}

export function Avatar({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string;
  alt: string;
  fallback: string;
  className?: string;
}) {
  return src ? (
    <NextImage
      className={cn("bg-muted size-10 rounded-full object-cover", className)}
      src={src}
      alt={alt}
      width={40}
      height={40}
    />
  ) : (
    <span
      className={cn(
        "bg-muted text-muted-foreground inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold",
        className,
      )}
      aria-label={alt}
    >
      {fallback.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-foreground text-lg font-bold tracking-normal",
        className,
      )}
    >
      LandingForge
    </span>
  );
}

export function GalleryItem({
  children,
  caption,
}: {
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <figure className="border-border bg-surface-elevated overflow-hidden rounded-md border">
      {children}
      {caption ? (
        <figcaption className="text-muted-foreground px-3 py-2 text-sm">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
