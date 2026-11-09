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
        <CardTitle>Dados estruturados</CardTitle>
        <CardDescription>
          JSON-LD Schema.org preparado para apresentação pública.
        </CardDescription>
      </CardHeader>
      <pre className="bg-muted max-h-96 overflow-auto rounded-md p-4 text-xs">
        {schemaJson
          ? JSON.stringify(schemaJson, null, 2)
          : "Ainda não existem dados estruturados."}
      </pre>
    </Card>
  );
}
