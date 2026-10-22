import { AuthShell } from "@/features/auth/components/auth-shell";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AccessDeniedPage() {
  return (
    <AuthShell
      title="Não tens acesso a esta área"
      description="O teu perfil não tem autorização para abrir esta página. Se consideras que se trata de um erro, contacta um administrador."
    >
      <div className="grid gap-4">
        <p className="text-muted-foreground text-sm">Erro 403 · Acesso não autorizado</p>
        <Link className={cn(buttonVariants({ variant: "primary" }))} href="/dashboard">Voltar ao dashboard</Link>
      </div>
    </AuthShell>
  );
}
