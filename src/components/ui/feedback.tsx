import * as React from "react";
import {
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toneStyles = {
  neutral: "border-border bg-surface text-foreground",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  error: "border-error/25 bg-error/10 text-error",
  info: "border-info/25 bg-info/10 text-info",
} as const;

export function Alert({
  className,
  tone = "info",
  title,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: keyof typeof toneStyles;
  title?: string;
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "warning"
        ? TriangleAlert
        : tone === "error"
          ? XCircle
          : Info;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border p-4",
        toneStyles[tone],
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-sm leading-6">{children}</div>
      </div>
    </div>
  );
}

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      tone: toneStyles,
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Status({
  className,
  tone = "neutral",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneStyles }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium",
        tone === "neutral"
          ? "text-muted-foreground"
          : toneStyles[tone].split(" ").at(-1),
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          tone === "neutral" && "bg-muted-foreground",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "error" && "bg-error",
          tone === "info" && "bg-info",
        )}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function LoadingSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2
        className={cn("size-4 animate-spin", className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-md", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function ToastRegion({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 grid max-w-sm gap-3",
        className,
      )}
      aria-live="polite"
      aria-relevant="additions"
      {...props}
    />
  );
}

export function LoadingState({ title = "A carregar..." }: { title?: string }) {
  return (
    <div className="border-border bg-surface grid place-items-center rounded-md border p-8 text-center">
      <LoadingSpinner />
      <p className="text-muted-foreground mt-3 text-sm">{title}</p>
    </div>
  );
}

export function ErrorState({
  title = "Algo correu mal.",
  description = "Tenta novamente.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Alert tone="error" title={title}>
      {description}
    </Alert>
  );
}
