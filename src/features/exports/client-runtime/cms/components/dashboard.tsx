import type { ClientCmsInstallation } from "../contracts";

export function ClientCmsDashboard({
  businessName,
  installation,
  sectionCount,
  formCount,
  newLeadCount,
}: {
  businessName: string;
  installation: ClientCmsInstallation;
  sectionCount: number;
  formCount: number;
  newLeadCount: number;
}) {
  const metrics = [
    { label: "Secções da landing", value: sectionCount },
    { label: "Formulários", value: formCount },
    { label: "Novos contactos", value: newLeadCount },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-border pb-6">
        <p className="text-sm font-medium text-muted-foreground">Gestão da landing page</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">{businessName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {installation.templateKey} · {installation.variantKey} · versão {installation.templateVersion}
        </p>
      </header>
      <section aria-label="Resumo" className="grid gap-4 py-6 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="border border-border p-5">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{metric.value}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
