import type { FormSubmission } from "@/generated/prisma/client";
import { DataTable } from "@/components/ui/data-display";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout";

export function SubmissionsSummary({
  submissions,
}: {
  submissions: FormSubmission[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissões recentes</CardTitle>
        <CardDescription>
          Total de submissões e atividade recente.
        </CardDescription>
      </CardHeader>
      <DataTable
        caption="Submissões recentes"
        columns={["Data", "Estado", "Conteúdo"]}
        rows={submissions.map((submission) => [
          submission.createdAt.toLocaleString("pt-PT"),
          submission.status.toLowerCase(),
          <code className="text-xs" key={submission.id}>
            {JSON.stringify(submission.data).slice(0, 120)}
          </code>,
        ])}
        scrollHint="Use as setas do teclado ou deslize horizontalmente para consultar todas as colunas."
        scrollRegionLabel="Tabela de submissões recentes, deslocável horizontalmente"
      />
    </Card>
  );
}
