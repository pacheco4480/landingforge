import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { PrivacyRequestStatus, PrivacyRequestType } from "@/generated/prisma/client";
import {
  createPrivacyRequest,
  getPrivacyAccessExport,
  getPrivacyWorkspace,
  updatePrivacyRequest,
} from "@/features/privacy/services/privacy.service";
import { defaultPrivacyRequestDueDate, maximumPrivacyRequestDueDate } from "@/features/privacy/privacy-workflow";
import { db } from "@/lib/db";

const enabled = process.env.RUN_PRIVACY_DB_INTEGRATION === "1";
const databaseName = process.env.DATABASE_URL
  ? decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1))
  : "";
const safeDatabase = /(?:^|[_-])test(?:[_-]|$)/i.test(databaseName);
const fixture = { userId: "", clientId: "", requestIds: [] as string[] };

describe("privacy lifecycle PostgreSQL integration", () => {
  it.skipIf(!enabled)("queues retention candidates and gates access export on verification and review", async () => {
    if (!safeDatabase) throw new Error("O teste exige uma base de dados descartável cujo nome contenha 'test'.");

    const user = await db.user.create({ data: { name: "Privacy Test Operator", email: `privacy-${randomUUID()}@example.test` }, select: { id: true } });
    fixture.userId = user.id;
    const client = await db.client.create({
      data: {
        name: "Titular de teste",
        businessName: `Privacy Fixture ${randomUUID()}`,
        email: `subject-${randomUUID()}@example.test`,
        internalNotes: "NOTA_INTERNA_NAO_EXPORTAR",
        lastMeaningfulContactAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      select: { id: true },
    });
    fixture.clientId = client.id;

    const workspace = await getPrivacyWorkspace();
    expect(workspace.retentionCandidates.prospects.some((item) => item.id === client.id)).toBe(true);

    const request = await createPrivacyRequest({
      type: PrivacyRequestType.ACCESS,
      requesterName: "Titular de teste",
      requesterEmail: "subject@example.test",
      clientId: client.id,
      projectId: null,
      dueAt: null,
    }, user);
    fixture.requestIds.push(request.id);
    const initialDueAt = defaultPrivacyRequestDueDate(request.receivedAt);
    expect(request.dueAt?.toISOString()).toBe(initialDueAt.toISOString());
    const unsupportedInitialDeadline = new Date(initialDueAt);
    unsupportedInitialDeadline.setUTCDate(unsupportedInitialDeadline.getUTCDate() + 1);
    await expect(createPrivacyRequest({
      type: PrivacyRequestType.ACCESS,
      requesterName: "Titular de teste",
      requesterEmail: "subject@example.test",
      clientId: client.id,
      projectId: null,
      dueAt: unsupportedInitialDeadline.toISOString().slice(0, 10),
    }, user)).rejects.toThrow("prazo inicial");
    const pastDeadline = new Date(request.receivedAt);
    pastDeadline.setUTCDate(pastDeadline.getUTCDate() - 1);
    await expect(createPrivacyRequest({
      type: PrivacyRequestType.ACCESS,
      requesterName: "Titular de teste",
      requesterEmail: "subject@example.test",
      clientId: client.id,
      projectId: null,
      dueAt: pastDeadline.toISOString().slice(0, 10),
    }, user)).rejects.toThrow("anterior à receção");
    const audit = await db.auditLog.findFirstOrThrow({ where: { entityType: "privacy_request", entityId: request.id } });
    expect(JSON.stringify(audit.newValues)).not.toContain("subject@example.test");
    await expect(getPrivacyAccessExport(request.id)).rejects.toThrow("verificado e aprovado");

    await updatePrivacyRequest({ id: request.id, status: PrivacyRequestStatus.VERIFYING, identityVerificationMethod: "", decisionSummary: "" }, user);
    await updatePrivacyRequest({ id: request.id, status: PrivacyRequestStatus.VERIFIED, identityVerificationMethod: "Canal previamente registado", decisionSummary: "" }, user);
    await updatePrivacyRequest({ id: request.id, status: PrivacyRequestStatus.REVIEW, identityVerificationMethod: "", decisionSummary: "" }, user);
    await updatePrivacyRequest({ id: request.id, status: PrivacyRequestStatus.APPROVED, identityVerificationMethod: "", decisionSummary: "" }, user);

    const data = await getPrivacyAccessExport(request.id);
    expect(data.dataSubject).toMatchObject({ id: client.id, name: "Titular de teste" });
    expect(data.dataSubject).not.toHaveProperty("internalNotes");
    expect(data.excludedCategoriesForManualReview).toContain("respostas e revisões de briefing");
    const beyondMaximumDue = maximumPrivacyRequestDueDate(request.receivedAt);
    beyondMaximumDue.setUTCDate(beyondMaximumDue.getUTCDate() + 1);
    await expect(updatePrivacyRequest({
      id: request.id,
      status: PrivacyRequestStatus.IN_PROGRESS,
      identityVerificationMethod: "",
      decisionSummary: "",
      dueAt: "2026-12-15",
    }, user)).rejects.toThrow("motivo da alteração do prazo");
    const extendedDue = new Date(initialDueAt);
    extendedDue.setUTCDate(extendedDue.getUTCDate() + 10);
    const extendedDueAt = extendedDue.toISOString().slice(0, 10);
    const communicatedAt = new Date(request.receivedAt);
    communicatedAt.setUTCDate(communicatedAt.getUTCDate() + 10);
    const communicatedDate = communicatedAt.toISOString().slice(0, 10);
    const extensionReason = "Prorrogação necessária devido à complexidade da pesquisa.";

    await expect(updatePrivacyRequest({
      id: request.id,
      status: PrivacyRequestStatus.IN_PROGRESS,
      identityVerificationMethod: "",
      decisionSummary: extensionReason,
      dueAt: extendedDueAt,
      extensionCommunicatedAt: "",
      extensionCommunicationChannel: "",
    }, user)).rejects.toThrow("canal usado para comunicar");
    await expect(updatePrivacyRequest({
      id: request.id,
      status: PrivacyRequestStatus.IN_PROGRESS,
      identityVerificationMethod: "",
      decisionSummary: extensionReason,
      dueAt: beyondMaximumDue.toISOString().slice(0, 10),
      extensionCommunicatedAt: initialDueAt.toISOString().slice(0, 10),
      extensionCommunicationChannel: "email",
    }, user)).rejects.toThrow("ultrapassa o limite operacional");
    await expect(updatePrivacyRequest({
      id: request.id,
      status: PrivacyRequestStatus.IN_PROGRESS,
      identityVerificationMethod: "",
      decisionSummary: extensionReason,
      dueAt: extendedDueAt,
      extensionCommunicatedAt: new Date(initialDueAt.getTime() + 86400000).toISOString().slice(0, 10),
      extensionCommunicationChannel: "email",
    }, user)).rejects.toThrow("entre a receção do pedido e o prazo inicial");
    await updatePrivacyRequest({
      id: request.id,
      status: PrivacyRequestStatus.IN_PROGRESS,
      identityVerificationMethod: "",
      decisionSummary: extensionReason,
      dueAt: extendedDueAt,
      extensionCommunicatedAt: communicatedDate,
      extensionCommunicationChannel: "email",
    }, user);
    const persistedExtension = await db.privacyRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(persistedExtension.extensionCommunicatedAt?.toISOString().slice(0, 10)).toBe(communicatedDate);
    expect(persistedExtension.extensionCommunicationChannel).toBe("email");
    const deadlineAudit = await db.auditLog.findFirstOrThrow({
      where: { entityType: "privacy_request", entityId: request.id, action: "privacy.request.status" },
      orderBy: { createdAt: "desc" },
    });
    expect(deadlineAudit.newValues).toMatchObject({ deadlineChanged: true, extensionCommunicationChannel: "email" });
    expect(JSON.stringify(deadlineAudit.newValues)).not.toContain("complexidade da pesquisa");
    await updatePrivacyRequest({
      id: request.id,
      status: PrivacyRequestStatus.COMPLETED,
      identityVerificationMethod: "",
      decisionSummary: "Resposta preparada para revisão.",
      dueAt: extendedDueAt,
    }, user);
    await expect(updatePrivacyRequest({ id: request.id, status: PrivacyRequestStatus.VERIFIED, identityVerificationMethod: "", decisionSummary: "" }, user)).rejects.toThrow("transição não é permitida");
  }, 20000);

  afterAll(async () => {
    if (!fixture.userId) return;
    await db.privacyRequest.deleteMany({ where: { id: { in: fixture.requestIds } } });
    if (fixture.clientId) await db.client.deleteMany({ where: { id: fixture.clientId } });
    // The audit log is immutable by design; this integration is run only in a disposable database.
  });
});
