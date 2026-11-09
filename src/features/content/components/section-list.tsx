import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Card, CardHeader, CardTitle, Stack } from "@/components/ui/layout";
import {
  deleteSectionAction,
  duplicateSectionAction,
  moveSectionAction,
  toggleSectionVisibilityAction,
} from "@/features/content/actions/section.actions";
import { SectionForm } from "@/features/content/components/section-form";
import { sectionTypeLabel } from "@/features/content/section-types";

type SectionRow = {
  id: string;
  pageId: string;
  name: string;
  sectionType: string;
  sortOrder: number;
  isVisible: boolean;
  content: unknown;
  settings: unknown;
};

function SectionActionForm({
  action,
  section,
  children,
  direction,
}: {
  action: (formData: FormData) => void | Promise<void>;
  section: SectionRow;
  children: React.ReactNode;
  direction?: "up" | "down";
}) {
  return (
    <form action={action}>
      <input name="id" type="hidden" value={section.id} />
      <input name="pageId" type="hidden" value={section.pageId} />
      {direction ? (
        <input name="direction" type="hidden" value={direction} />
      ) : null}
      {children}
    </form>
  );
}

export function SectionList({
  sections,
  canWrite,
  templateKey,
  templateVariantKey,
}: {
  sections: SectionRow[];
  canWrite: boolean;
  templateKey?: string | null;
  templateVariantKey?: string | null;
}) {
  if (sections.length === 0) {
    return (
      <Card>
        <p className="font-semibold">Ainda não existem secções</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Adiciona uma secção para começares a organizar o conteúdo da landing page.
        </p>
      </Card>
    );
  }

  return (
    <Stack>
      {sections.map((section, index) => (
        <Card key={section.id}>
          <CardHeader className="md:flex md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{section.name}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{sectionTypeLabel(section.sectionType)}</Badge>
                <Badge tone={section.isVisible ? "success" : "warning"}>
                  {section.isVisible ? "Visível" : "Oculta"}
                </Badge>
              </div>
            </div>
            {canWrite ? (
              <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
                <SectionActionForm
                  action={moveSectionAction}
                  direction="up"
                  section={section}
                >
                  <Button
                    aria-label={`Mover ${section.name} para cima`}
                    disabled={index === 0}
                    size="icon"
                    type="submit"
                    variant="outline"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                </SectionActionForm>
                <SectionActionForm
                  action={moveSectionAction}
                  direction="down"
                  section={section}
                >
                  <Button
                    aria-label={`Mover ${section.name} para baixo`}
                    disabled={index === sections.length - 1}
                    size="icon"
                    type="submit"
                    variant="outline"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                </SectionActionForm>
                <SectionActionForm
                  action={toggleSectionVisibilityAction}
                  section={section}
                >
                  <Button
                    aria-label={`${section.isVisible ? "Ocultar" : "Mostrar"} ${section.name}`}
                    size="icon"
                    type="submit"
                    variant="outline"
                  >
                    {section.isVisible ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </SectionActionForm>
                <SectionActionForm
                  action={duplicateSectionAction}
                  section={section}
                >
                  <Button
                    aria-label={`Duplicar ${section.name}`}
                    size="icon"
                    type="submit"
                    variant="outline"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </Button>
                </SectionActionForm>
                <SectionActionForm
                  action={deleteSectionAction}
                  section={section}
                >
                  <Button
                    aria-label={`Eliminar ${section.name}`}
                    size="icon"
                    type="submit"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </SectionActionForm>
              </div>
            ) : null}
          </CardHeader>
          {canWrite ? (
            <SectionForm
              section={section}
              templateKey={templateKey}
              templateVariantKey={templateVariantKey}
            />
          ) : null}
        </Card>
      ))}
    </Stack>
  );
}
