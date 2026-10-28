import type { PrismaClient } from "../../src/generated/prisma/client";

const permissions = [
  "cms.read",
  "cms.write",
  "cms.delete",
  "dashboard.read",
  "pages.read",
  "pages.write",
  "leads.read",
  "leads.write",
  "leads.export",
  "forms.read",
  "forms.write",
  "media.read",
  "media.write",
  "media.delete",
  "settings.read",
  "settings.write",
  "admin.access",
  "seo.read",
  "seo.write",
  "users.read",
  "users.write",
  "audit.read",
  "audit.export",
  "backups.read",
  "backups.create",
  "backups.restore",
  "clients.read",
  "clients.write",
  "clients.notes.read",
  "clients.notes.write",
  "projects.read",
  "projects.write",
  "projects.export",
  "projects.assign",
] as const;

const rolePermissions = {
  super_admin: permissions,
  client_admin: [
    "cms.read",
    "cms.write",
    "dashboard.read",
    "pages.read",
    "pages.write",
    "leads.read",
    "leads.write",
    "leads.export",
    "forms.read",
    "forms.write",
    "media.read",
    "media.write",
    "settings.read",
    "settings.write",
    "seo.read",
    "seo.write",
  ],
  viewer: [
    "cms.read",
    "dashboard.read",
    "pages.read",
    "leads.read",
    "forms.read",
    "media.read",
    "seo.read",
    "settings.read",
  ],
} as const;

const industries = [
  ["real_estate", "Real Estate"],
  ["clinic", "Clinic"],
  ["restaurant", "Restaurant"],
  ["bakery", "Bakery"],
  ["gym", "Gym"],
  ["construction", "Construction"],
  ["beauty", "Beauty"],
] as const;

const leadStages = [
  ["New", "#2563eb"],
  ["Contacted", "#0891b2"],
  ["In Negotiation", "#d97706"],
  ["Converted", "#16a34a"],
  ["Lost", "#dc2626"],
] as const;

export async function seedCore(prisma: PrismaClient) {
  const permissionRecords = new Map<string, { id: string }>();

  for (const key of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
      select: { id: true },
    });

    permissionRecords.set(key, permission);
  }

  for (const [name, assignedPermissions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    });

    for (const permissionKey of assignedPermissions) {
      const permission = permissionRecords.get(permissionKey);

      if (!permission) {
        throw new Error(`Missing seeded permission: ${permissionKey}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    const assignedPermissionIds = assignedPermissions.map((permissionKey) => {
      const permission = permissionRecords.get(permissionKey);

      if (!permission) {
        throw new Error(`Missing seeded permission: ${permissionKey}`);
      }

      return permission.id;
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { notIn: assignedPermissionIds },
      },
    });
  }

  for (const [key, name] of industries) {
    await prisma.industry.upsert({
      where: { key },
      update: { name, isActive: true },
      create: { key, name },
    });
  }

  for (const [sortOrder, [name, color]] of leadStages.entries()) {
    await prisma.leadStage.upsert({
      where: { name },
      update: { color, sortOrder, isDefault: true },
      create: { name, color, sortOrder, isDefault: true },
    });
  }
}
