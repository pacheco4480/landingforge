import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

type SeoPageOption = {
  id: string;
  title: string;
  slug: string;
  isDemo: boolean;
  template: { name: string } | null;
  templateVariant: { name: string } | null;
};

export function SeoPageSelector({
  pages,
  selectedPageId,
}: {
  pages: SeoPageOption[];
  selectedPageId?: string;
}) {
  return (
    <form action="/seo" className="flex max-w-xl gap-3">
      <Select
        aria-label="Selecionar página para SEO"
        defaultValue={selectedPageId}
        name="pageId"
      >
        {pages.map((page) => (
          <option key={page.id} value={page.id}>
            {page.title} {page.isDemo ? "(Demo)" : ""} - /{page.slug}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="outline">
        Abrir
      </Button>
    </form>
  );
}
