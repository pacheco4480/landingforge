import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/feedback";
import { isCmsEnabled } from "@/config/deployment";
import { resetPasswordAction } from "@/features/auth/actions/auth.actions";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SubmitButton } from "@/features/auth/components/submit-button";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  if (!isCmsEnabled()) redirect("/");

  const { token = "", error } = await searchParams;
  return (
    <AuthShell
      title="Definir nova palavra-passe"
      description="Usa pelo menos oito caracteres, incluindo uma letra e um número."
    >
      {error && (
        <Alert className="mb-4" tone="error">
          Esta ligação é inválida ou expirou. Solicita uma nova ligação de recuperação.
        </Alert>
      )}
      <form action={resetPasswordAction} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        <AuthField
          label="Nova palavra-passe"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <SubmitButton>Atualizar palavra-passe</SubmitButton>
      </form>
    </AuthShell>
  );
}
