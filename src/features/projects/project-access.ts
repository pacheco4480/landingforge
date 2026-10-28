import type { Prisma } from "@/generated/prisma/client";

type ProjectActor = { id: string; roles: readonly string[] };

export function projectWhereForActor(actor: ProjectActor): Prisma.ProjectWhereInput {
  if (actor.roles.includes("super_admin")) return {};

  return { assignments: { some: { userId: actor.id } } };
}
