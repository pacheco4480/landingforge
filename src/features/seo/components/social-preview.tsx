import { GoogleSearchPreview, OpenGraphPreview } from "@/components/ui/seo";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
} from "@/components/ui/layout";

export function SocialPreview({
  title,
  description,
  canonicalUrl,
  siteName,
  imageUrl,
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  siteName: string;
  imageUrl?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Google and social sharing appearance.</CardDescription>
      </CardHeader>
      <Grid className="lg:grid-cols-2">
        <GoogleSearchPreview
          title={title}
          description={description}
          url={canonicalUrl}
        />
        <OpenGraphPreview
          title={title}
          description={description}
          siteName={siteName}
          imageUrl={imageUrl}
        />
      </Grid>
    </Card>
  );
}
