import { Skeleton } from "@/components/ui/feedback";
import { Grid } from "@/components/ui/layout";

export function CmsLoadingState() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-24" />
      <Grid className="md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </Grid>
    </div>
  );
}
