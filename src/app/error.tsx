"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-16">
      <section className="border-border bg-card grid max-w-lg gap-5 rounded-lg border p-6 text-center shadow-sm">
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm font-medium">
            Erro inesperado
          </p>
          <h1 className="text-2xl font-semibold">Algo correu mal</h1>
          <p className="text-muted-foreground text-sm leading-6">
            Não foi possível carregar esta área. Tenta novamente ou volta à
            página inicial.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Tentar novamente
          </Button>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
            Voltar à página inicial
          </Link>
        </div>
      </section>
    </main>
  );
}
