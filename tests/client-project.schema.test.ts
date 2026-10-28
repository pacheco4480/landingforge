import { describe, expect, it } from "vitest";

import { clientSchema } from "@/features/clients/schemas/client.schema";
import { projectWhereForActor } from "@/features/projects/project-access";
import { projectSchema } from "@/features/projects/schemas/project.schema";
import {
  MaintenancePlan,
  ProjectDeliveryMode,
  ProjectParty,
  ProjectPriority,
  ProjectServiceType,
  ProjectStatus,
} from "@/generated/prisma/client";

describe("Client and Project contracts", () => {
  it("accepts client contacts and rejects unsupported website protocols", () => {
    const base = {
      name: "Ana Silva",
      businessName: "Estúdio Exemplo",
      status: "LEAD",
    };

    expect(clientSchema.safeParse(base).success).toBe(true);
    expect(clientSchema.safeParse({ ...base, website: "javascript:alert(1)" }).success).toBe(false);
    expect(clientSchema.safeParse({ ...base, email: "inválido" }).success).toBe(false);
  });

  it("requires a template when a variant is selected and validates delivery dates", () => {
    const base = {
      clientId: "3a100000-0000-4000-8000-000000000001",
      name: "Landing institucional",
      serviceType: ProjectServiceType.TEMPLATE_ADAPTATION,
      status: ProjectStatus.BRIEFING,
      priority: ProjectPriority.NORMAL,
      templateVariantId: "3a100000-0000-4000-8000-000000000002",
      deliveryMode: ProjectDeliveryMode.LANDING_ONLY,
      siteManagementOwner: ProjectParty.LANDINGFORGE,
      hostingOwner: ProjectParty.CLIENT,
      domainOwner: ProjectParty.CLIENT,
      contentOwner: ProjectParty.CLIENT,
      publishingOwner: ProjectParty.LANDINGFORGE,
      maintenancePlan: MaintenancePlan.NONE,
      assigneeIds: [],
    };

    expect(projectSchema.safeParse(base).success).toBe(false);
    expect(projectSchema.safeParse({
      ...base,
      templateVariantId: "",
      startDate: "2026-10-20",
      deliveryDate: "2026-10-19",
    }).success).toBe(false);
    expect(projectSchema.safeParse({
      ...base,
      templateVariantId: "",
    }).success).toBe(true);
  });

  it("builds database access scope from assignments and gives global scope only to Super Admin", () => {
    expect(projectWhereForActor({ id: "user-a", roles: ["admin"] })).toEqual({
      assignments: { some: { userId: "user-a" } },
    });
    expect(projectWhereForActor({ id: "client-user", roles: ["client_admin"] })).toEqual({
      assignments: { some: { userId: "client-user" } },
    });
    expect(projectWhereForActor({ id: "user-root", roles: ["super_admin"] })).toEqual({});
  });
});
