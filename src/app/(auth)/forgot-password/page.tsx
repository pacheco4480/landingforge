import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/feedback";
import { isCmsEnabled } from "@/config/deployment";
import { forgotPasswordAction } from "@/features/auth/actions/auth.actions";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SubmitButton } from "@/features/auth/components/submit-button";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  if (!isCmsEnabled()) redirect("/");

  const { sent } = await searchParams;
  return (
    <AuthShell
      title="Reset password"
      description="Enter your email to receive reset instructions."
    >
      {sent && (
        <Alert className="mb-4" tone="success">
          If the account exists, reset instructions were sent.
        </Alert>
      )}
      <form action={forgotPasswordAction} className="grid gap-5">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <SubmitButton>Send instructions</SubmitButton>
      </form>
    </AuthShell>
  );
}
