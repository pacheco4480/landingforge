import { Badge } from "@/components/ui/feedback";
import { Card, Stack } from "@/components/ui/layout";

type PreviewSection = {
  id: string;
  name: string;
  sectionType: string;
  isVisible: boolean;
  content: unknown;
};

function extractPreviewText(content: unknown) {
  if (!content || typeof content !== "object") {
    return "No preview content.";
  }

  return Object.entries(content)
    .slice(0, 4)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
    )
    .join(" | ");
}

export function ContentPreview({ sections }: { sections: PreviewSection[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Live Preview Foundation</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Basic safe preview of the persisted content structure.
      </p>
      <Stack className="mt-5">
        {sections.map((section) => (
          <article
            className="border-border rounded-md border p-4"
            key={section.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{section.name}</h3>
              <Badge>{section.sectionType}</Badge>
              <Badge tone={section.isVisible ? "success" : "warning"}>
                {section.isVisible ? "Visible" : "Hidden"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              {extractPreviewText(section.content)}
            </p>
          </article>
        ))}
      </Stack>
    </Card>
  );
}
