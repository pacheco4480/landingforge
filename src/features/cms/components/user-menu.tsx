import { Avatar } from "@/components/ui/media";
import { LogoutButton } from "@/features/auth/components/logout-button";

export function UserMenu({
  name,
  email,
  roles,
}: {
  name: string;
  email: string;
  roles: readonly string[];
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground text-xs">
          {roles.join(", ") || email}
        </p>
      </div>
      <Avatar alt={`${name} profile`} fallback={name || email} />
      <div>
        <LogoutButton />
      </div>
    </div>
  );
}
