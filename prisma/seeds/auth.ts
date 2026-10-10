import { hash } from "argon2";

import {
  UserStatus,
  type PrismaClient,
} from "../../src/generated/prisma/client";

const developmentUsers = [
  [
    "SEED_SUPER_ADMIN_PASSWORD",
    "admin@landingforge.local",
    "Super Admin",
    "super_admin",
  ],
  [
    "SEED_CLIENT_ADMIN_PASSWORD",
    "client@landingforge.local",
    "Client Admin",
    "client_admin",
  ],
  ["SEED_VIEWER_PASSWORD", "viewer@landingforge.local", "Viewer", "viewer"],
] as const;

export async function seedAuth(prisma: PrismaClient) {
  for (const [passwordKey, email, name, roleName] of developmentUsers) {
    const password = process.env[passwordKey];
    if (!password) continue;

    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleName },
    });
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, status: UserStatus.ACTIVE },
      create: {
        email,
        name,
        status: UserStatus.ACTIVE,
        passwordHash: await hash(password, { type: 2 }),
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }
}
