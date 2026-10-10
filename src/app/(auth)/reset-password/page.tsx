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
      title="Choose a new password"
      description="Use at least eight characters, one letter and one number."
    >
      {error && (
        <Alert className="mb-4" tone="error">
          This reset link is invalid or expired.
        </Alert>
      )}
      <form action={resetPasswordAction} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        <AuthField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <SubmitButton>Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}
