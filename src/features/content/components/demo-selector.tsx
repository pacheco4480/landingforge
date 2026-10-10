import Link from "next/link";

import { Alert, Badge } from "@/components/ui/feedback";
import { Card } from "@/components/ui/layout";

type DemoPage = {
  id: string;
  title: string;
  demoKey: string | null;
  isDemo: boolean;
  template: { name: string; key: string } | null;
  templateVariant: { name: string; key: string } | null;
};

export function DemoSelector({
  pages,
  canUseDemoMode,
}: {
  pages: DemoPage[];
  canUseDemoMode: boolean;
}) {
  if (!canUseDemoMode) {
    return (
      <Alert tone="info">
        Client Mode is active. This CMS only exposes the client landing page.
      </Alert>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Internal Demo Mode</h2>
          <p className="text-muted-foreground text-sm">
            Select an isolated demo to edit without affecting clients.
          </p>
        </div>
        <Badge tone="info">Super Admin</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => (
          <Link
            className="border-border hover:bg-muted rounded-md border p-4 transition-colors"
            href={`/content/${page.id}`}
            key={page.id}
          >
            <p className="font-semibold">{page.title}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {page.template?.name ?? "Template"} /{" "}
              {page.templateVariant?.name ?? "Variant"}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">{page.demoKey}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
