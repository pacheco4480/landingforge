import { Badge } from "@/components/ui/feedback";
import { Card, Container, Grid, Section, Stack } from "@/components/ui/layout";
import { Logo } from "@/components/ui/media";

const foundations = [
  "Next.js App Router",
  "TypeScript strict",
  "Tailwind CSS",
  "shadcn/ui ready",
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center">
      <Container className="max-w-5xl">
        <Section>
          <Stack className="max-w-3xl gap-4">
            <Logo />
            <Badge>Project foundation</Badge>
            <h1 className="text-4xl leading-tight font-bold sm:text-6xl">
              LandingForge
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg leading-8">
              A modular foundation for premium, high-converting landing pages.
            </p>
          </Stack>

          <section aria-labelledby="foundation-heading" className="mt-12">
            <h2 id="foundation-heading" className="sr-only">
              Configured foundations
            </h2>
            <Grid className="sm:grid-cols-2">
              {foundations.map((foundation) => (
                <Card key={foundation} className="p-4 text-sm font-medium">
                  {foundation}
                </Card>
              ))}
            </Grid>
          </section>
        </Section>
      </Container>
    </main>
  );
}
