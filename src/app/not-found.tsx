import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16 text-foreground">
      <section aria-labelledby="not-found-title" className="grid w-full max-w-lg gap-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Erro 404</p>
        <h1 className="text-3xl font-semibold" id="not-found-title">Não encontrámos esta página</h1>
        <p className="leading-7 text-muted-foreground">O endereço pode estar incorreto ou a página já não estar disponível.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2" href="/portfolio">Explorar o portfolio</Link>
          <Link className="inline-flex min-h-11 items-center rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2" href="/">Voltar ao início</Link>
        </div>
      </section>
    </main>
  );
}
