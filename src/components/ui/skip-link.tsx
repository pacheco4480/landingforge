import { cn } from "@/lib/utils";

export function SkipLink({
  href = "#main-content",
  children = "Saltar para o conteudo principal",
  className,
}: {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={cn(
        "bg-primary text-primary-foreground focus-visible:outline-ring sr-only fixed top-3 left-3 z-[100] rounded-md px-4 py-2 text-sm font-semibold focus:not-sr-only focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      href={href}
    >
      {children}
    </a>
  );
}
