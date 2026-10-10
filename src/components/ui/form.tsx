import * as React from "react";

import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-foreground text-sm font-medium", className)}
      {...props}
    />
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-ring disabled:bg-muted min-h-11 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        error && "border-error focus:border-error",
        className,
      )}
      aria-invalid={error || props["aria-invalid"]}
      {...props}
    />
  );
}

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: boolean;
  };

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus-visible:outline-ring disabled:bg-muted min-h-28 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        error && "border-error focus:border-error",
        className,
      )}
      aria-invalid={error || props["aria-invalid"]}
      {...props}
    />
  );
}

export function Field({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function FieldMessage({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  tone?: "muted" | "error" | "success";
}) {
  return (
    <p
      className={cn(
        "text-sm",
        tone === "muted" && "text-muted-foreground",
        tone === "error" && "text-error",
        tone === "success" && "text-success",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "border-input bg-background text-foreground focus:border-ring focus-visible:outline-ring disabled:bg-muted min-h-11 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function MultiSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <Select className={cn("min-h-32", className)} multiple {...props} />;
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border-input accent-primary focus-visible:outline-ring size-5 shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      type="checkbox"
      {...props}
    />
  );
}

export function Radio({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border-input accent-primary focus-visible:outline-ring size-5 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      type="radio"
      {...props}
    />
  );
}

export function RadioGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-3", className)} role="radiogroup" {...props} />
  );
}

export function Switch({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "bg-input checked:bg-primary focus-visible:outline-ring h-7 w-12 cursor-pointer appearance-none rounded-full transition-colors before:block before:size-6 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform checked:before:translate-x-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      type="checkbox"
      role="switch"
      {...props}
    />
  );
}
