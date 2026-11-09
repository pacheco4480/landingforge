import { Badge } from "@/components/ui/feedback";
import { PageStatus } from "@/generated/prisma/client";

export function PageStatusBadge({ status }: { status: PageStatus }) {
  if (status === PageStatus.PUBLISHED) {
    return <Badge tone="success">Publicada</Badge>;
  }

  if (status === PageStatus.ARCHIVED) {
    return <Badge tone="warning">Arquivada</Badge>;
  }

  return <Badge>Rascunho</Badge>;
}
