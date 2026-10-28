import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    project: { findFirst: vi.fn() },
    projectMaintenanceRelease: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findFirstOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ db: dbMock }));

import { ProjectDeliveryMode, ProjectMaintenanceDestination, ProjectMaintenanceReleaseStatus } from "@/generated/prisma/client";
import {
  downloadMaintenanceRelease,
  getMaintenanceCandidateForPage,
  listProjectMaintenanceReleases,
  recordMaintenancePublication,
  saveMaintenanceCodeChange,
  validateMaintenanceRelease,
  type MaintenanceActor,
} from "@/features/projects/services/project-maintenance.service";
import { listClientRuntimeMaintenanceSources } from "@/features/exports/services/client-runtime-project-assembler";

const actor: MaintenanceActor = {
  id: "operator-1",
  roles: ["staff"],
  permissions: ["projects.write"],
};

function managedProject() {
  return {
    id: "project-1",
    deliveryMode: ProjectDeliveryMode.LANDING_ONLY,
    maintenancePlan: "CONTRACTED",
    maintenanceScope: "Conteúdo e imagens",
    templateVersion: "restaurant/playful@1.0.0",
    sourceVersions: [],
  };
}

describe("project maintenance release workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.$transaction.mockImplementation(async (callback: (tx: typeof dbMock) => Promise<unknown>) => callback(dbMock));
    dbMock.project.findFirst.mockResolvedValue(managedProject());
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValue({
      id: "release-1",
      projectId: "project-1",
      status: ProjectMaintenanceReleaseStatus.DRAFT,
    });
  });

  it("blocks project operators without project assignment", async () => {
    dbMock.project.findFirst.mockResolvedValueOnce(null);

    await expect(getMaintenanceCandidateForPage("page-1", actor)).rejects.toThrow("sem acesso");
    expect(dbMock.project.findFirst).toHaveBeenCalledOnce();
  });

  it("does not send stored source code in the compact release history query", async () => {
    dbMock.projectMaintenanceRelease.findMany.mockResolvedValueOnce([]);

    await listProjectMaintenanceReleases("project-1", actor);

    const query = dbMock.projectMaintenanceRelease.findMany.mock.calls[0][0];
    expect(query.select).toBeDefined();
    expect(query.select).not.toHaveProperty("codeChanges");
  });

  it("does not allow editing a published candidate", async () => {
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValueOnce({
      id: "release-1",
      projectId: "project-1",
      status: ProjectMaintenanceReleaseStatus.PUBLISHED,
    });

    await expect(getMaintenanceCandidateForPage("page-1", actor)).rejects.toThrow("imutável");
  });

  it("stores structural source changes on the isolated draft and invalidates previous validation", async () => {
    const source = listClientRuntimeMaintenanceSources("restaurant", "playful").find((file) => file.sourcePath.endsWith("restaurant-playful.tsx"));
    expect(source).toBeDefined();
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValueOnce({
      id: "release-1",
      projectId: "project-1",
      status: ProjectMaintenanceReleaseStatus.VALIDATED,
      rebaseReport: null,
      codeChanges: null,
      candidatePage: {
        template: { key: "restaurant" },
        templateVariant: { key: "playful" },
      },
    });
    dbMock.projectMaintenanceRelease.updateMany.mockResolvedValueOnce({ count: 1 });

    await saveMaintenanceCodeChange({
      projectId: "project-1",
      releaseId: "release-1",
      sourcePath: source!.sourcePath,
      content: `${source!.content}\n// proposta estrutural`,
      actor,
    });

    expect(dbMock.projectMaintenanceRelease.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "release-1", projectId: "project-1", status: { not: ProjectMaintenanceReleaseStatus.PUBLISHED } },
      data: expect.objectContaining({
        status: ProjectMaintenanceReleaseStatus.DRAFT,
        packageChecksum: null,
        validationReport: expect.anything(),
        codeChanges: [expect.objectContaining({ sourcePath: source!.sourcePath, packagePath: source!.packagePath, updatedByUserId: actor.id })],
      }),
    }));
    expect(JSON.stringify(dbMock.auditLog.create.mock.calls)).not.toContain("proposta estrutural");
  });

  it("allows an operator to explicitly remove a code patch whose source file is no longer in the variant graph", async () => {
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValueOnce({
      id: "release-1",
      projectId: "project-1",
      status: ProjectMaintenanceReleaseStatus.DRAFT,
      rebaseReport: null,
      codeChanges: [{
        sourcePath: "src/features/public-renderer/templates/restaurant/removed.tsx",
        packagePath: "src/client-runtime/features/public-renderer/templates/restaurant/removed.tsx",
        content: "export const stale = true;",
        baseChecksum: "a".repeat(64),
        updatedByUserId: actor.id,
        updatedAt: new Date().toISOString(),
      }],
      candidatePage: {
        template: { key: "restaurant" },
        templateVariant: { key: "playful" },
      },
    });
    dbMock.projectMaintenanceRelease.updateMany.mockResolvedValueOnce({ count: 1 });

    await saveMaintenanceCodeChange({
      projectId: "project-1",
      releaseId: "release-1",
      sourcePath: "src/features/public-renderer/templates/restaurant/removed.tsx",
      content: "",
      actor,
    });

    expect(dbMock.projectMaintenanceRelease.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ codeChanges: expect.anything(), status: ProjectMaintenanceReleaseStatus.DRAFT }),
    }));
    expect(dbMock.projectMaintenanceRelease.updateMany.mock.calls.at(-1)?.[0].data.codeChanges).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ sourcePath: "src/features/public-renderer/templates/restaurant/removed.tsx" }),
    ]));
  });

  it("blocks package validation until every rebase conflict has a recorded decision", async () => {
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValueOnce({
      id: "release-1",
      projectId: "project-1",
      status: ProjectMaintenanceReleaseStatus.DRAFT,
      rebaseReport: { conflicts: ["formulário.contact.campo.email.label"], conflictResolutions: [] },
    });

    await expect(validateMaintenanceRelease("project-1", "release-1", actor)).rejects.toThrow("Resolve e regista todos os conflitos");
    expect(dbMock.projectMaintenanceRelease.update).not.toHaveBeenCalled();
  });

  it("blocks artifact download when a previously validated rebase still has unresolved conflicts", async () => {
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValueOnce({
      id: "release-1",
      projectId: "project-1",
      status: ProjectMaintenanceReleaseStatus.VALIDATED,
      rebaseReport: { conflicts: ["secção.hero.content.title"], conflictResolutions: [] },
    });

    await expect(downloadMaintenanceRelease("project-1", "release-1", actor)).rejects.toThrow("conflitos do rebase por resolver");
    expect(dbMock.projectMaintenanceRelease.update).not.toHaveBeenCalled();
  });

  it("requires a downloaded artifact before recording publication", async () => {
    dbMock.projectMaintenanceRelease.findFirstOrThrow.mockResolvedValueOnce({
      status: ProjectMaintenanceReleaseStatus.VALIDATED,
      packageChecksum: "a".repeat(64),
      packageDownloadedAt: null,
      approvalRequired: false,
    });

    await expect(recordMaintenancePublication({
      projectId: "project-1",
      releaseId: "release-1",
      destination: ProjectMaintenanceDestination.CLIENT_HOSTED,
      destinationLabel: "cliente.example",
      verification: "Página e formulário verificados.",
      actor,
    })).rejects.toThrow("Descarrega primeiro");
    expect(dbMock.projectMaintenanceRelease.update).not.toHaveBeenCalled();
  });

  it("requires recorded client approval when the release requests it", async () => {
    dbMock.projectMaintenanceRelease.findFirstOrThrow.mockResolvedValueOnce({
      status: ProjectMaintenanceReleaseStatus.VALIDATED,
      packageChecksum: "a".repeat(64),
      packageDownloadedAt: new Date(),
      approvalRequired: true,
      approvedAt: null,
    });

    await expect(recordMaintenancePublication({
      projectId: "project-1",
      releaseId: "release-1",
      destination: ProjectMaintenanceDestination.CLIENT_HOSTED,
      destinationLabel: "cliente.example",
      verification: "Página e formulário verificados.",
      actor,
    })).rejects.toThrow("aprovação do cliente");
    expect(dbMock.projectMaintenanceRelease.update).not.toHaveBeenCalled();
  });

  it("records a verified publication without storing deployment credentials", async () => {
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValueOnce(null);
    dbMock.projectMaintenanceRelease.findFirstOrThrow.mockResolvedValueOnce({
      id: "release-1",
      version: 2,
      baseReleaseId: null,
      status: ProjectMaintenanceReleaseStatus.VALIDATED,
      packageChecksum: "b".repeat(64),
      packageDownloadedAt: new Date(),
      approvalRequired: false,
      approvedAt: null,
    });
    dbMock.projectMaintenanceRelease.update.mockResolvedValueOnce({});
    dbMock.auditLog.create.mockResolvedValueOnce({});

    await expect(recordMaintenancePublication({
      projectId: "project-1",
      releaseId: "release-1",
      destination: ProjectMaintenanceDestination.CLIENT_HOSTED,
      destinationLabel: "cliente.example",
      verification: "HTTPS, landing e formulário verificados em staging/prod.",
      actor,
    })).resolves.toBeUndefined();

    expect(dbMock.projectMaintenanceRelease.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "release-1" },
      data: expect.objectContaining({
        status: ProjectMaintenanceReleaseStatus.PUBLISHED,
        destination: ProjectMaintenanceDestination.CLIENT_HOSTED,
        publishedByUserId: actor.id,
        deploymentVerifiedAt: expect.any(Date),
      }),
    }));
    expect(JSON.stringify(dbMock.auditLog.create.mock.calls)).not.toMatch(/password|secret|token/i);
  });

  it("blocks publication when a newer release was published after this candidate was created", async () => {
    dbMock.projectMaintenanceRelease.findFirstOrThrow.mockResolvedValueOnce({
      id: "release-2",
      version: 2,
      baseReleaseId: "release-1",
      status: ProjectMaintenanceReleaseStatus.VALIDATED,
      packageChecksum: "c".repeat(64),
      packageDownloadedAt: new Date(),
      approvalRequired: false,
      approvedAt: null,
    });
    dbMock.projectMaintenanceRelease.findFirst.mockResolvedValueOnce({ id: "release-3" });

    await expect(recordMaintenancePublication({
      projectId: "project-1",
      releaseId: "release-2",
      destination: ProjectMaintenanceDestination.CLIENT_HOSTED,
      destinationLabel: "cliente.example",
      verification: "Página verificada.",
      actor,
    })).rejects.toThrow("parte de uma versão antiga");
    expect(dbMock.projectMaintenanceRelease.update).not.toHaveBeenCalled();
  });
});
