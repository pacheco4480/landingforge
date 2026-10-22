export function PortfolioLoadingState({ label = "A carregar o portfolio..." }: { label?: string }) {
  return (
    <main aria-busy="true" aria-live="polite" className="mx-auto grid min-h-screen w-full max-w-7xl content-start gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <div className="aspect-[4/3] animate-pulse rounded-md bg-muted motion-reduce:animate-none" key={index} />)}
      </div>
    </main>
  );
}
