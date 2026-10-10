import { Badge } from "@/components/ui/feedback";

export function CmsPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 max-w-3xl">
      {eyebrow ? <Badge className="mb-3">{eyebrow}</Badge> : null}
      <h1 className="text-3xl leading-tight font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
