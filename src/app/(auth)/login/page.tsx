import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/feedback";
import { isCmsEnabled } from "@/config/deployment";
import { loginAction } from "@/features/auth/actions/auth.actions";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SubmitButton } from "@/features/auth/components/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    reset?: string;
  }>;
}) {
  if (!isCmsEnabled()) redirect("/");

  const params = await searchParams;
  return (
    <AuthShell
      title="Iniciar sessão"
      description="Acede ao CMS LandingForge de forma segura."
    >
      {params.error === "invalid" && (
        <Alert className="mb-4" tone="error">
          Email ou palavra-passe inválidos.
        </Alert>
      )}
      {params.error === "session-expired" && (
        <Alert className="mb-4" tone="error">
          A sessão expirou. Inicia sessão novamente.
        </Alert>
      )}
      {params.reset && (
        <Alert className="mb-4" tone="success">
          Palavra-passe atualizada com sucesso.
        </Alert>
      )}
      <form action={loginAction} className="grid gap-5">
        <input
          type="hidden"
          name="callbackUrl"
          value={params.callbackUrl ?? "/dashboard"}
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <AuthField
          label="Palavra-passe"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <SubmitButton>Iniciar sessão</SubmitButton>
      </form>
      <Link
        className="text-primary mt-6 inline-block text-sm font-medium underline-offset-4 hover:underline"
        href="/forgot-password"
      >
        Esqueceste-te da palavra-passe?
      </Link>
    </AuthShell>
  );
}
