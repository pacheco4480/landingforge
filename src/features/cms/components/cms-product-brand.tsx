export function CmsProductBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {compact ? null : (
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-sm bg-primary text-xs font-bold text-primary-foreground"
        >
          LF
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">LandingForge</span>
        {compact ? null : (
          <span className="text-muted-foreground mt-0.5 block text-xs">
            Operações da plataforma
          </span>
        )}
      </span>
    </div>
  );
}
