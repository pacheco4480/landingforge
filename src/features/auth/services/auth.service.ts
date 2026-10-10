import { UserStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { verifyPassword } from "@/features/auth/services/password.service";
import { recordAuthEvent } from "@/features/auth/services/auth-audit.service";

export async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (
    !user?.passwordHash ||
    user.status !== UserStatus.ACTIVE ||
    !(await verifyPassword(user.passwordHash, password))
  ) {
    return null;
  }

  const roles = user.roles.map(({ role }) => role.name);
  const permissions = [
    ...new Set(
      user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.key),
      ),
    ),
  ];

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await recordAuthEvent("user.login", user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles,
    permissions,
    authorizationVersion: user.authorizationVersion,
  };
}
