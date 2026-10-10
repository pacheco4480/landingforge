import * as React from "react";

import { Card } from "@/components/ui/layout";

export function MetaConfiguration({
  title,
  description,
  canonicalUrl,
}: {
  title: string;
  description: string;
  canonicalUrl?: string;
}) {
  return (
    <Card>
      <h3 className="text-lg font-semibold">Meta configuration</h3>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground font-medium">Title</dt>
          <dd>{title}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-medium">Description</dt>
          <dd>{description}</dd>
        </div>
        {canonicalUrl ? (
          <div>
            <dt className="text-muted-foreground font-medium">Canonical</dt>
            <dd className="break-all">{canonicalUrl}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}

export function GoogleSearchPreview({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <Card>
      <p className="text-success text-sm">{url}</p>
      <h3 className="text-primary mt-1 line-clamp-2 text-xl">{title}</h3>
      <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">
        {description}
      </p>
    </Card>
  );
}

export function OpenGraphPreview({
  title,
  description,
  siteName = "LandingForge",
  imageUrl,
}: {
  title: string;
  description: string;
  siteName?: string;
  imageUrl?: string | null;
}) {
  return (
    <Card className="max-w-xl p-0">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="bg-muted aspect-[1200/630] w-full rounded-t-md object-cover"
          src={imageUrl}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div className="bg-muted aspect-[1200/630]" aria-hidden="true" />
      )}
      <div className="p-4">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          {siteName}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
          {description}
        </p>
      </div>
    </Card>
  );
}
