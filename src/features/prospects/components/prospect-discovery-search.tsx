"use client";

import * as React from "react";
import { ExternalLink, Search } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import { Card, Stack } from "@/components/ui/layout";
import { searchProspectDiscoveryAction } from "@/features/prospects/actions/prospect.actions";
import type { DiscoveryProviderResolution, ProspectDiscoverySuggestion } from "@/features/prospects/providers/discovery-provider";

type Availability = Extract<DiscoveryProviderResolution, { available: false }>["reason"];

const unavailableMessages: Record<Availability | "unavailable", string> = {
  disabled: "A pesquisa automática está indisponível. Para não ter custos nem depender de termos externos, usa a entrada manual ou a importação CSV.",
  unavailable: "Não foi possível obter resultados. Tenta novamente mais tarde.",
};

export function ProspectDiscoverySearch({ availability }: { availability: Availability | null }) {
  const [query, setQuery] = React.useState("");
  const [locality, setLocality] = React.useState("");
  const [results, setResults] = React.useState<ProspectDiscoverySuggestion[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResults([]);
    startTransition(async () => {
      try {
        const response = await searchProspectDiscoveryAction({ query, locality });
        if (!response.ok) {
          setError(unavailableMessages[response.reason]);
          return;
        }
        setResults(response.results);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : unavailableMessages.unavailable);
      }
    });
  }

  return (
    <Card>
      <Stack>
        <div>
          <h2 className="text-base font-semibold">Pesquisa assistida</h2>
          <p className="text-muted-foreground mt-1 text-sm">Pesquisa empresarial pontual. Os resultados são temporários, não verificados e não são guardados automaticamente.</p>
        </div>
        {availability ? (
          <Alert tone="info" title="Modo gratuito: entrada manual e CSV">
            {unavailableMessages[availability]}
          </Alert>
        ) : null}
        <form onSubmit={search} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field>
            <Label htmlFor="discovery-query">Tipo de negócio</Label>
            <Input id="discovery-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} minLength={2} required placeholder="Ex.: clínicas dentárias" disabled={Boolean(availability)} />
          </Field>
          <Field>
            <Label htmlFor="discovery-locality">Localidade</Label>
            <Input id="discovery-locality" value={locality} onChange={(event) => setLocality(event.target.value)} maxLength={120} minLength={2} required placeholder="Ex.: Lisboa" disabled={Boolean(availability)} />
          </Field>
          <Button type="submit" isLoading={isPending} disabled={Boolean(availability)}>
            <Search aria-hidden="true" /> Pesquisar
          </Button>
        </form>
        {error ? <p className="text-error text-sm" role="alert">{error}</p> : null}
        {results.length ? (
          <div className="grid gap-3" aria-label="Resultados temporários">
            <p className="text-muted-foreground text-sm" role="status">{results.length} sugestões. Confirma cada informação na respetiva fonte antes de criar um registo.</p>
            {results.map((result) => (
              <article key={result.providerRecordId} className="border-border grid gap-2 rounded-md border p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <h3 className="font-semibold">{result.businessName}</h3>
                  <p className="text-muted-foreground text-sm">{[result.industry, result.locality, result.address].filter(Boolean).join(" · ") || "Localização não indicada"}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{result.attribution} · recolhido em {result.retrievedAt} · por confirmar</p>
                </div>
                {result.website ? <a className="text-primary inline-flex min-h-11 items-center gap-2 text-sm underline-offset-4 hover:underline" href={result.website} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="size-4" /> Abrir website</a> : null}
              </article>
            ))}
          </div>
        ) : null}
      </Stack>
    </Card>
  );
}
