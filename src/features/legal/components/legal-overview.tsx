import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/layout";
import { Field, Input, Label } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function LegalOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportacao de dados pessoais</CardTitle>
        <CardDescription>
          Exporta dados associados a um email para responder a pedidos de acesso.
        </CardDescription>
      </CardHeader>
      <form action="/settings/legal-export" className="grid gap-4 md:grid-cols-[1fr_auto]" method="get">
        <Field>
          <Label htmlFor="legal-export-email">Email</Label>
          <Input id="legal-export-email" name="email" type="email" required />
        </Field>
        <Button className="self-end" type="submit" variant="outline">
          Exportar JSON
        </Button>
      </form>
    </Card>
  );
}
