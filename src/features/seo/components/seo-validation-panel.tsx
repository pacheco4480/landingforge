import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/layout";
import type { SeoCheck } from "@/features/seo/services/seo-score.service";

export function SeoValidationPanel({
  score,
  checks,
}: {
  score: number;
  checks: SeoCheck[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Score</CardTitle>
        <CardDescription>
          Simple readiness checks for metadata and visibility.
        </CardDescription>
      </CardHeader>
      <div className="flex items-end gap-3">
        <p className="text-4xl font-bold">{score}</p>
        <p className="text-muted-foreground pb-1 text-sm">/ 100</p>
      </div>
      <ul className="mt-5 grid gap-3">
        {checks.map((check) => (
          <li
            key={check.label}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-sm font-semibold">{check.label}</p>
              <p className="text-muted-foreground text-sm">{check.message}</p>
            </div>
            <span
              className={
                check.passed
                  ? "bg-success/10 text-success rounded-md px-2 py-1 text-xs font-semibold"
                  : "bg-warning/10 text-warning rounded-md px-2 py-1 text-xs font-semibold"
              }
            >
              {check.passed ? "OK" : "Review"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
