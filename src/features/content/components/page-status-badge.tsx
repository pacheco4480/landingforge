import { Badge } from "@/components/ui/feedback";
import { PageStatus } from "@/generated/prisma/client";

export function PageStatusBadge({ status }: { status: PageStatus }) {
  if (status === PageStatus.PUBLISHED) {
    return <Badge tone="success">Published</Badge>;
  }

  if (status === PageStatus.ARCHIVED) {
    return <Badge tone="warning">Archived</Badge>;
  }

  return <Badge>Draft</Badge>;
}
