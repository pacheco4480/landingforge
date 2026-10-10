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
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>
          Analytics foundation for total submissions and recent activity.
        </CardDescription>
      </CardHeader>
      <DataTable
        columns={["Date", "Status", "Data"]}
        rows={submissions.map((submission) => [
          submission.createdAt.toLocaleString("pt-PT"),
          submission.status.toLowerCase(),
          <code className="text-xs" key={submission.id}>
            {JSON.stringify(submission.data).slice(0, 120)}
          </code>,
        ])}
      />
    </Card>
  );
}
