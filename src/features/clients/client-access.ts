import type { Prisma } from "@/generated/prisma/client";
import { projectWhereForActor } from "@/features/projects/project-access";

type ClientActor = { id: string; roles: readonly string[] };

export function clientWhereForActor(actor: ClientActor): Prisma.ClientWhereInput {
  if (actor.roles.includes("super_admin")) return {};
  return { projects: { some: projectWhereForActor(actor) } };
}
