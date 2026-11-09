import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions/auth.actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline">
        Terminar sessão
      </Button>
    </form>
  );
}
