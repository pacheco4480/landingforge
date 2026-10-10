import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Dialog({
  title,
  description,
  children,
  className,
  open = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  open?: boolean;
}) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="presentation"
    >
      <section
        className={cn(
          "border-border bg-background w-full max-w-lg rounded-md border p-6 shadow-xl",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        {description ? (
          <p
            id={descriptionId}
            className="text-muted-foreground mt-2 text-sm"
          >
            {description}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}

export const Modal = Dialog;

export function Drawer({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  const titleId = React.useId();

  if (!open) {
    return null;
  }

  return (
    <aside
      className="border-border bg-background fixed inset-y-0 right-0 z-50 w-full max-w-md border-l p-6 shadow-xl"
      aria-labelledby={titleId}
      role="dialog"
      aria-modal="true"
    >
      <h2 id={titleId} className="text-xl font-semibold">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </aside>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  open = false,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  open?: boolean;
}) {
  return (
    <Dialog title={title} description={description} open={open}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline">
          {cancelLabel}
        </Button>
        <Button type="button" variant="destructive">
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
