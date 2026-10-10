"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="pt-PT">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-white px-4 py-16 text-slate-950">
          <section className="grid max-w-lg gap-5 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="grid gap-2">
              <p className="text-sm font-medium text-slate-500">
                Erro crítico
              </p>
              <h1 className="text-2xl font-semibold">Algo correu mal</h1>
              <p className="text-sm leading-6 text-slate-600">
                O sistema não conseguiu recuperar automaticamente. Tenta
                novamente ou volta à página inicial.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                className="min-h-11 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                type="button"
                onClick={reset}
              >
                Tentar novamente
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
                href="/"
              >
                Voltar à página inicial
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
