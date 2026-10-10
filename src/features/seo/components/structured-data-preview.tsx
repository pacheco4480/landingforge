import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout";

export function StructuredDataPreview({ schemaJson }: { schemaJson: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Structured Data</CardTitle>
        <CardDescription>
          Schema.org JSON-LD prepared for public rendering.
        </CardDescription>
      </CardHeader>
      <pre className="bg-muted max-h-96 overflow-auto rounded-md p-4 text-xs">
        {schemaJson
          ? JSON.stringify(schemaJson, null, 2)
          : "No structured data yet."}
      </pre>
    </Card>
  );
}
