import { Card, Container, Stack } from "@/components/ui/layout";
import { Logo } from "@/components/ui/media";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center py-12">
      <Container className="max-w-md">
        <Stack className="gap-6">
          <Logo />
          <Card className="p-6">
            <h1 className="text-3xl leading-tight font-bold">{title}</h1>
            <p className="text-muted-foreground mt-3">{description}</p>
            <div className="mt-8">{children}</div>
          </Card>
        </Stack>
      </Container>
    </main>
  );
}
