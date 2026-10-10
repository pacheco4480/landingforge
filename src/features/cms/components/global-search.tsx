import { Search } from "lucide-react";

export function GlobalSearch() {
  return (
    <form className="relative hidden w-full max-w-sm md:block" role="search">
      <label className="sr-only" htmlFor="cms-global-search">
        Search pages, leads and media
      </label>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        className="border-input bg-background placeholder:text-muted-foreground focus:border-ring min-h-11 w-full rounded-md border pr-3 pl-9 text-sm focus:outline-none"
        id="cms-global-search"
        name="q"
        placeholder="Search pages, leads, media"
        type="search"
        disabled
      />
    </form>
  );
}
