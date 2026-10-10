import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:outline-ring",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted focus-visible:outline-ring",
        ghost:
          "bg-transparent text-foreground hover:bg-muted focus-visible:outline-ring",
        link: "min-h-0 px-0 py-0 text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-error text-error-foreground hover:bg-error/90 focus-visible:outline-ring",
      },
      size: {
        sm: "min-h-9 px-3 text-xs",
        md: "min-h-11 px-4",
        lg: "min-h-12 px-5 text-base",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
