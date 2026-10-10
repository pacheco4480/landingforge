import { AuthShell } from "@/features/auth/components/auth-shell";

export default function AccessDeniedPage() {
  return (
    <AuthShell
      title="Access denied"
      description="You do not have permission to access this area."
    >
      {null}
    </AuthShell>
  );
}
