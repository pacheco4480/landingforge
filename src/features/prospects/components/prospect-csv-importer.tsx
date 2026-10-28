"use client";

import * as React from "react";
import { FileUp } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Field, Label, Select, Textarea } from "@/components/ui/form";
import { Card, Grid, Stack } from "@/components/ui/layout";
import { importProspectCsvAction, previewProspectImportAction } from "@/features/prospects/actions/prospect.actions";
import { parseCsv, prospectCsvHeaders, type ProspectCsvHeader } from "@/features/prospects/prospect-utils";

const labels: Record<ProspectCsvHeader, string> = {
  businessName: "Empresa", contactName: "Contacto", email: "Email profissional", phone: "Telefone",
  industry: "Nicho / setor", locality: "Localidade", website: "Website", publicProfileUrl: "Perfil empresarial",
  sourceUrl: "Fonte consultada", factualNotes: "Observações factuais",
};

function normalizedHeader(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const aliases: Record<string, ProspectCsvHeader> = {
  businessname: "businessName", empresa: "businessName", nomeempresa: "businessName", company: "businessName",
  contactname: "contactName", contacto: "contactName", pessoa: "contactName", email: "email", emailprofissional: "email",
  phone: "phone", telefone: "phone", industry: "industry", setor: "industry", nicho: "industry",
  locality: "locality", localidade: "locality", zona: "locality", website: "website", site: "website",
  perfil: "publicProfileUrl", perfilpublico: "publicProfileUrl", sourceurl: "sourceUrl", fonte: "sourceUrl",
  observacoes: "factualNotes", notas: "factualNotes",
};

type Preview = Awaited<ReturnType<typeof previewProspectImportAction>>;

export function ProspectCsvImporter() {
  const [csv, setCsv] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [matrix, setMatrix] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Partial<Record<ProspectCsvHeader, string>>>({});
  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function readCsv(source: string) {
    setCsv(source);
    setPreview(null);
    setError(null);
    try {
      const parsed = parseCsv(source);
      if (parsed.length < 2) throw new Error("Inclui uma linha de cabeçalho e pelo menos um registo.");
      const nextHeaders = parsed[0]!.map((item) => item.trim());
      setHeaders(nextHeaders);
      setMatrix(parsed.slice(1));
      const nextMapping: Partial<Record<ProspectCsvHeader, string>> = {};
      for (const header of nextHeaders) {
        const field = aliases[normalizedHeader(header)];
        if (field && !nextMapping[field]) nextMapping[field] = header;
      }
      setMapping(nextMapping);
    } catch (cause) {
      setHeaders([]);
      setMatrix([]);
      setError(cause instanceof Error ? cause.message : "Não foi possível interpretar o CSV.");
    }
  }

  function mappedRecords() {
    return matrix.map((cells) => Object.fromEntries(prospectCsvHeaders.map((field) => {
      const selectedHeader = mapping[field];
      const columnIndex = selectedHeader ? headers.indexOf(selectedHeader) : -1;
      return [field, columnIndex < 0 ? "" : cells[columnIndex] ?? ""];
    })));
  }

  function previewRows() {
    if (!mapping.businessName) {
      setError("Mapeia a coluna Empresa antes de validar.");
      return;
    }
    setError(null);
    const mapped = mappedRecords();
    setRows(mapped);
    startTransition(async () => {
      try {
        setPreview(await previewProspectImportAction(mapped));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Não foi possível validar o CSV.");
      }
    });
  }

  const headerOptions = headers.map((header, index) => ({ key: `${index}:${header}`, value: header }));

  return (
    <Stack>
      <Alert tone="warning" title="Importação controlada">O CSV é validado no servidor. Não incluas dados pessoais desnecessários. A importação não envia emails; contactos suprimidos e duplicados são excluídos.</Alert>
      <Card>
        <Stack>
          <Field>
            <Label htmlFor="csv">CSV com cabeçalho</Label>
            <Textarea id="csv" value={csv} onChange={(event) => readCsv(event.target.value)} placeholder={'empresa,email,website,nicho,localidade,fonte\nExemplo Lda,contacto@exemplo.pt,https://exemplo.pt,Restaurante,Lisboa,https://exemplo.pt/contactos'} className="min-h-48 font-mono text-xs" />
            <p className="text-muted-foreground text-sm">Máximo: 500 KB e 500 registos. Suporta campos CSV entre aspas e quebras de linha.</p>
          </Field>
          {headers.length ? <>
            <h2 className="text-base font-semibold">Mapeamento de colunas</h2>
            <Grid className="sm:grid-cols-2 lg:grid-cols-3">
              {prospectCsvHeaders.map((field) => <Field key={field}><Label htmlFor={`map-${field}`}>{labels[field]}{field === "businessName" ? " *" : ""}</Label><Select id={`map-${field}`} value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value || undefined }))}><option value="">Não importar</option>{headerOptions.map((option) => <option key={option.key} value={option.value}>{option.value}</option>)}</Select></Field>)}
            </Grid>
            <div><Button type="button" variant="secondary" onClick={previewRows} isLoading={isPending}><FileUp aria-hidden="true" /> Validar e pré-visualizar</Button></div>
          </> : null}
          {error ? <p role="alert" className="text-error text-sm">{error}</p> : null}
        </Stack>
      </Card>
      {preview ? <Card>
        <Stack>
          <h2 className="text-base font-semibold">Pré-visualização: {preview.accepted} a importar, {preview.rejected} rejeitados/duplicados/suprimidos</h2>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm"><caption className="sr-only">Resultado da validação de cada linha CSV</caption><thead><tr><th scope="col" className="px-2 py-2">Linha</th><th scope="col" className="px-2 py-2">Empresa</th><th scope="col" className="px-2 py-2">Email</th><th scope="col" className="px-2 py-2">Resultado</th></tr></thead><tbody>{preview.rows.map((item) => <tr key={item.line} className="border-border border-t"><td className="px-2 py-2">{item.line}</td><td className="px-2 py-2">{String(item.row.businessName ?? "")}</td><td className="px-2 py-2">{String(item.row.email ?? "")}</td><td className="px-2 py-2">{item.error ?? (item.suppressed ? "Suprimido" : item.duplicateOf !== null ? item.duplicateOf === 0 ? "Já existe" : `Duplicado da linha ${item.duplicateOf}` : "Pronto")}</td></tr>)}</tbody></table>
          </div>
          {preview.accepted > 0 ? <form action={importProspectCsvAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="rows" value={JSON.stringify(rows)} /><Button type="submit">Importar {preview.accepted} registos válidos</Button><span className="text-muted-foreground text-sm">A gravação dos registos válidos é transacional; se falhar, não guarda uma parte silenciosamente.</span></form> : <p className="text-muted-foreground text-sm">Não há linhas válidas para importar.</p>}
        </Stack>
      </Card> : null}
    </Stack>
  );
}
