import { Badge } from "@/components/ui/feedback";
import { Container, Stack } from "@/components/ui/layout";
import { LogoutButton } from "@/features/auth/components/logout-button";

export function ProtectedPlaceholder({
  title,
  userName,
}: {
  title: string;
  userName: string;
}) {
  return (
    <main className="flex min-h-screen items-center py-12">
      <Container className="max-w-4xl">
        <Stack className="gap-4">
          <Badge>Authenticated area</Badge>
          <h1 className="text-4xl leading-tight font-bold">{title}</h1>
          <p className="text-muted-foreground">Signed in as {userName}.</p>
          <LogoutButton />
        </Stack>
      </Container>
    </main>
  );
}
