import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/data-display";

export function CmsEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <Icon
          className="text-muted-foreground mx-auto size-8"
          aria-hidden="true"
        />
      }
    />
  );
}
