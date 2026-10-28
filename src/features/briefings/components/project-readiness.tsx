import type { ProjectReadiness as ProjectReadinessScores } from "@/features/briefings/project-readiness";

function ReadinessSection({
  title,
  score,
}: {
  title: string;
  score: ProjectReadinessScores["content"];
}) {
  return (
    <section className="border-border grid content-start gap-2 rounded-md border p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-sm font-semibold tabular-nums">{score.percent}%</span>
      </div>
      <progress
        className="accent-primary h-2 w-full"
        value={score.completed}
        max={score.total}
        aria-label={`${title}: ${score.percent}%`}
      />
      <p className="text-muted-foreground text-xs">
        {score.completed} de {score.total} critérios registados
      </p>
      {score.missing.length ? (
        <p className="text-muted-foreground text-xs">
          A tratar: {score.missing.join(" · ")}
        </p>
      ) : (
        <p className="text-success text-xs">Todos os critérios estão preenchidos.</p>
      )}
    </section>
  );
}

export function ProjectReadiness({
  scores,
}: {
  scores: ProjectReadinessScores;
}) {
  return (
    <section className="grid gap-3" aria-labelledby="project-readiness-title">
      <div>
        <h3 id="project-readiness-title" className="font-semibold">Prontidão do projeto</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Indicadores operacionais calculados apenas a partir do briefing e da checklist; não avaliam automaticamente a qualidade dos materiais.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ReadinessSection title="Conteúdo base" score={scores.content} />
        <ReadinessSection title="Identidade de marca" score={scores.branding} />
      </div>
    </section>
  );
}
