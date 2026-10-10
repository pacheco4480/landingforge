import Link from "next/link";
import type { DemoStatus, PageStatus } from "@/generated/prisma/client";
import {
  ActionFeedbackForm,
  ConfirmActionForm,
} from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import {
  archiveDemoAction,
  deleteDemoAction,
  duplicateDemoAction,
} from "@/features/content/actions/demo.actions";

export type DemoCardValue = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  demoKey: string | null;
  demoStatus: DemoStatus | null;
  portfolioVisible: boolean;
  template: { name: string } | null;
  templateVariant: { name: string } | null;
  theme: { name: string } | null;
};

export function DemoCard({ demo }: { demo: DemoCardValue }) {
  return (
    <article className="border-border bg-surface-elevated rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{demo.title}</h3>
          <p className="text-muted-foreground mt-1 text-sm">/{demo.slug}</p>
        </div>
        <Badge tone={demo.portfolioVisible ? "success" : "neutral"}>
          {demo.portfolioVisible ? "Portfolio" : "Oculta"}
        </Badge>
      </div>
      <dl className="text-muted-foreground mt-4 grid gap-2 text-sm">
        <div>Demo: {demo.demoStatus?.toLowerCase() ?? "draft"}</div>
        <div>Publico: {demo.status.toLowerCase()}</div>
        <div>
          {demo.template?.name ?? "Sem template"} /{" "}
          {demo.templateVariant?.name ?? "Sem variante"}
        </div>
        <div>{demo.theme?.name ?? "Sem tema"}</div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          className="border-border bg-background hover:bg-muted inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
          href={`/content/${demo.id}`}
        >
          Editar
        </Link>
        <Link
          className="border-border bg-background hover:bg-muted inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-semibold"
          href={`/content/demos/preview/${demo.id}`}
        >
          Preview
        </Link>
        <ActionFeedbackForm
          action={duplicateDemoAction}
          loadingMessage="A duplicar demo..."
          successMessage="Demo duplicada."
        >
          <input name="id" type="hidden" value={demo.id} />
          <Button size="sm" type="submit" variant="outline">
            Duplicar
          </Button>
        </ActionFeedbackForm>
        <ConfirmActionForm
          action={archiveDemoAction}
          confirmLabel="Arquivar"
          description="A demo deixa de aparecer como ativa."
          loadingMessage="A arquivar demo..."
          successMessage="Demo arquivada."
          title="Arquivar demo?"
        >
          <input name="id" type="hidden" value={demo.id} />
          <Button size="sm" type="submit" variant="outline">
            Arquivar
          </Button>
        </ConfirmActionForm>
        <ConfirmActionForm
          action={deleteDemoAction}
          confirmLabel="Eliminar"
          description="A demo sera removida do selector sem afetar clientes."
          loadingMessage="A eliminar demo..."
          successMessage="Demo eliminada."
          title="Eliminar demo?"
        >
          <input name="id" type="hidden" value={demo.id} />
          <Button size="sm" type="submit" variant="destructive">
            Eliminar
          </Button>
        </ConfirmActionForm>
      </div>
    </article>
  );
}
