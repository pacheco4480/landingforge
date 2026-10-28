import {
  ClientStatus,
  PrivacyRequestStatus,
  PrivacyRequestType,
  ProspectStatus,
  ProjectStatus,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  defaultPrivacyRequestDueDate,
  maximumPrivacyRequestDueDate,
  privacyExtensionChannels,
  privacyStatusTransitions,
  retentionCutoffDate,
  utcDateOnly,
} from "@/features/privacy/privacy-workflow";

type PrivacyActor = { id: string };

function dateAtStartOfDay(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function getPrivacyWorkspace() {
  const [policies, requests, clients, projects] = await Promise.all([
    db.privacyRetentionPolicy.findMany({ orderBy: { key: "asc" } }),
    db.privacyRequest.findMany({
      orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      take: 100,
      select: {
        id: true,
        type: true,
        status: true,
        requesterName: true,
        requesterEmail: true,
        receivedAt: true,
        dueAt: true,
        extensionCommunicatedAt: true,
        extensionCommunicationChannel: true,
        identityVerifiedAt: true,
        identityVerificationMethod: true,
        decisionSummary: true,
        resolvedAt: true,
        client: { select: { id: true, businessName: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    db.client.findMany({
      where: { deletedAt: null },
      orderBy: { businessName: "asc" },
      select: { id: true, businessName: true, name: true, email: true },
    }),
    db.project.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, clientId: true },
    }),
  ]);

  const prospectPolicy = policies.find((policy) => policy.key === "uncontracted_prospect");
  const projectPolicy = policies.find((policy) => policy.key === "project_working_data");
  const prospects = prospectPolicy?.enabled
    ? await db.client.findMany({
        where: {
          deletedAt: null,
          status: { in: [ClientStatus.LEAD, ClientStatus.QUALIFIED, ClientStatus.PROPOSAL_SENT, ClientStatus.NEGOTIATION] },
          lastMeaningfulContactAt: { not: null, lte: retentionCutoffDate(prospectPolicy.retentionDays) },
          projects: { none: {} },
        },
        orderBy: { lastMeaningfulContactAt: "asc" },
        take: 100,
        select: { id: true, businessName: true, status: true, lastMeaningfulContactAt: true },
      })
    : [];
  const prospectRecords = prospectPolicy?.enabled
    ? await db.prospect.findMany({
        where: {
          deletedAt: null,
          convertedClientId: null,
          status: { not: ProspectStatus.CONVERTED },
          lastMeaningfulContactAt: { not: null, lte: retentionCutoffDate(prospectPolicy.retentionDays) },
        },
        orderBy: { lastMeaningfulContactAt: "asc" },
        take: 100,
        select: { id: true, businessName: true, status: true, lastMeaningfulContactAt: true },
      })
    : [];
  const projectsForReview = projectPolicy?.enabled
    ? await db.project.findMany({
        where: {
          deletedAt: null,
          status: { in: [ProjectStatus.DELIVERED, ProjectStatus.ARCHIVED] },
          serviceEndedAt: { not: null, lte: retentionCutoffDate(projectPolicy.retentionDays) },
        },
        orderBy: { serviceEndedAt: "asc" },
        take: 100,
        select: { id: true, name: true, status: true, serviceEndedAt: true, client: { select: { businessName: true } } },
      })
    : [];

  return {
    policies,
    requests: requests.map((request) => ({ ...request, nextStatuses: privacyStatusTransitions[request.status] })),
    clients,
    projects,
    retentionCandidates: { prospects, prospectRecords, projects: projectsForReview },
  };
}

export async function updateRetentionPolicy(
  input: { id: string; retentionDays: number; purpose: string; legalBasisNote: string; enabled: boolean },
  actor: PrivacyActor,
) {
  return db.$transaction(async (tx) => {
    const current = await tx.privacyRetentionPolicy.findUniqueOrThrow({ where: { id: input.id } });
    const updated = await tx.privacyRetentionPolicy.update({
      where: { id: current.id },
      data: {
        retentionDays: input.retentionDays,
        purpose: input.purpose,
        legalBasisNote: input.legalBasisNote,
        enabled: input.enabled,
        automationEnabled: false,
        updatedByUserId: actor.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "privacy.retention_policy.update",
        entityType: "privacy_retention_policy",
        entityId: updated.id,
        oldValues: { retentionDays: current.retentionDays, enabled: current.enabled },
        newValues: { key: updated.key, retentionDays: updated.retentionDays, enabled: updated.enabled, automationEnabled: false },
      },
    });
    return updated;
  });
}

export async function createPrivacyRequest(
  input: {
    type: PrivacyRequestType;
    requesterName: string;
    requesterEmail: string;
    clientId: string | null;
    projectId: string | null;
    dueAt: string | null;
  },
  actor: PrivacyActor,
) {
  return db.$transaction(async (tx) => {
    if (input.projectId) {
      const project = await tx.project.findFirstOrThrow({
        where: { id: input.projectId, deletedAt: null },
        select: { clientId: true },
      });
      if (input.clientId && input.clientId !== project.clientId) {
        throw new Error("O projeto selecionado não pertence ao cliente indicado.");
      }
      input.clientId = project.clientId;
    }
    if (input.clientId) {
      await tx.client.findFirstOrThrow({ where: { id: input.clientId, deletedAt: null }, select: { id: true } });
    }
    const receivedAt = new Date();
    const dueAt = dateAtStartOfDay(input.dueAt) ?? defaultPrivacyRequestDueDate(receivedAt);
    if (dueAt < utcDateOnly(receivedAt)) {
      throw new Error("O prazo de resposta não pode ser anterior à receção do pedido.");
    }
    if (dueAt > defaultPrivacyRequestDueDate(receivedAt)) {
      throw new Error("Regista o pedido com o prazo inicial. Uma eventual prorrogação deve ser registada no fluxo de atualização, com motivo e comunicação comprovada.");
    }
    const request = await tx.privacyRequest.create({
      data: {
        type: input.type,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail.toLowerCase(),
        clientId: input.clientId,
        projectId: input.projectId,
        receivedAt,
        dueAt,
        createdByUserId: actor.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "privacy.request.create",
        entityType: "privacy_request",
        entityId: request.id,
        newValues: {
          type: request.type,
          status: request.status,
          dueAt: request.dueAt?.toISOString() ?? null,
          linkedClient: Boolean(request.clientId),
          linkedProject: Boolean(request.projectId),
        },
      },
    });
    return request;
  });
}

export async function updatePrivacyRequest(
  input: {
    id: string;
    status: PrivacyRequestStatus;
    identityVerificationMethod: string;
    decisionSummary: string;
    dueAt?: string | null;
    extensionCommunicatedAt?: string | null;
    extensionCommunicationChannel?: string;
  },
  actor: PrivacyActor,
) {
  return db.$transaction(async (tx) => {
    const current = await tx.privacyRequest.findUniqueOrThrow({ where: { id: input.id } });
    const dueAt = input.dueAt ? dateAtStartOfDay(input.dueAt) : current.dueAt;
    const deadlineChanged = dueAt?.getTime() !== current.dueAt?.getTime();
    const initialDueAt = defaultPrivacyRequestDueDate(current.receivedAt);
    const maximumDueAt = maximumPrivacyRequestDueDate(current.receivedAt);
    const extensionCommunicatedAt = dateAtStartOfDay(input.extensionCommunicatedAt ?? null);
    const extensionCommunicationChannel = input.extensionCommunicationChannel || current.extensionCommunicationChannel;
    const isExtendedDeadline = Boolean(dueAt && dueAt > initialDueAt);
    const extensionDetailsMissing = !current.extensionCommunicatedAt || !current.extensionCommunicationChannel;
    if (dueAt && dueAt < utcDateOnly(current.receivedAt)) {
      throw new Error("O prazo de resposta não pode ser anterior à receção do pedido.");
    }
    if (!privacyStatusTransitions[current.status].includes(input.status)) {
      throw new Error("Esta transição não é permitida. Revê o estado atual do pedido.");
    }
    if (input.status === PrivacyRequestStatus.VERIFIED && input.identityVerificationMethod.length < 4) {
      throw new Error("Regista o canal usado para confirmar a identidade antes de validar o pedido.");
    }
    if (input.status === PrivacyRequestStatus.APPROVED && !current.identityVerifiedAt) {
      throw new Error("Confirma a identidade antes de aprovar o tratamento do pedido.");
    }
    const isTerminalDecision = input.status === PrivacyRequestStatus.COMPLETED || input.status === PrivacyRequestStatus.PARTIALLY_COMPLETED || input.status === PrivacyRequestStatus.DECLINED;
    if (isTerminalDecision && input.decisionSummary.length < 8) {
      throw new Error("Regista uma síntese curta da decisão antes de concluir esta fase.");
    }
    if (deadlineChanged && input.decisionSummary.length < 8) {
      throw new Error("Regista o motivo da alteração do prazo para manter o histórico auditável.");
    }
    if (isExtendedDeadline) {
      if (!dueAt || dueAt > maximumDueAt) {
        throw new Error("O prazo registado ultrapassa o limite operacional de dois meses adicionais. Encaminha o caso para revisão competente.");
      }
      if (!privacyExtensionChannels.includes(extensionCommunicationChannel as typeof privacyExtensionChannels[number])) {
        throw new Error("Seleciona o canal usado para comunicar a prorrogação.");
      }
      const effectiveCommunicatedAt = extensionCommunicatedAt ?? current.extensionCommunicatedAt;
      if (!effectiveCommunicatedAt || utcDateOnly(effectiveCommunicatedAt) < utcDateOnly(current.receivedAt) || effectiveCommunicatedAt > initialDueAt) {
        throw new Error("Regista uma data de comunicação entre a receção do pedido e o prazo inicial.");
      }
      if ((deadlineChanged || extensionDetailsMissing) && (input.decisionSummary || current.decisionSummary || "").length < 8) {
        throw new Error("Regista o motivo da prorrogação sem incluir dados pessoais desnecessários.");
      }
    }
    const request = await tx.privacyRequest.update({
      where: { id: current.id },
      data: {
        status: input.status,
        ...(deadlineChanged ? { dueAt } : {}),
        ...(deadlineChanged || isExtendedDeadline ? {
          extensionCommunicatedAt: isExtendedDeadline ? extensionCommunicatedAt ?? current.extensionCommunicatedAt : null,
          extensionCommunicationChannel: isExtendedDeadline ? extensionCommunicationChannel : null,
        } : {}),
        ...(input.status === PrivacyRequestStatus.VERIFIED
          ? { identityVerifiedAt: new Date(), identityVerifiedById: actor.id, identityVerificationMethod: input.identityVerificationMethod }
          : {}),
        ...(input.decisionSummary ? { decisionSummary: input.decisionSummary } : {}),
        ...(isTerminalDecision
          ? { resolvedAt: new Date() }
          : {}),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "privacy.request.status",
        entityType: "privacy_request",
        entityId: request.id,
        oldValues: {
          status: current.status,
          dueAt: current.dueAt?.toISOString() ?? null,
          extensionCommunicatedAt: current.extensionCommunicatedAt?.toISOString() ?? null,
          extensionCommunicationChannel: current.extensionCommunicationChannel,
          hasExtensionReason: Boolean(current.extensionCommunicatedAt && current.decisionSummary),
        },
        newValues: {
          status: request.status,
          dueAt: request.dueAt?.toISOString() ?? null,
          deadlineChanged,
          extensionCommunicatedAt: request.extensionCommunicatedAt?.toISOString() ?? null,
          extensionCommunicationChannel: request.extensionCommunicationChannel,
          hasExtensionReason: Boolean(isExtendedDeadline && (input.decisionSummary || current.decisionSummary)),
          verified: Boolean(request.identityVerifiedAt),
          hasDecisionSummary: Boolean(request.decisionSummary),
        },
      },
    });
    return request;
  });
}

export async function getPrivacyAccessExport(requestId: string) {
  const request = await db.privacyRequest.findUnique({
    where: { id: requestId },
    select: { id: true, type: true, status: true, requesterName: true, requesterEmail: true, receivedAt: true, identityVerifiedAt: true, clientId: true, projectId: true },
  });
  if (!request || request.type !== PrivacyRequestType.ACCESS || request.status !== PrivacyRequestStatus.APPROVED || !request.identityVerifiedAt) {
    throw new Error("O pedido de acesso tem de estar verificado e aprovado antes de gerar a pré-visualização.");
  }
  let clientId = request.clientId;
  if (request.projectId && !clientId) {
    const project = await db.project.findUnique({ where: { id: request.projectId }, select: { clientId: true } });
    clientId = project?.clientId ?? null;
  }
  if (!clientId) throw new Error("Associa o pedido a um cliente ou projeto antes de preparar os dados.");

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: {
      id: true, name: true, businessName: true, industry: true, website: true, email: true, phone: true, address: true, vatNumber: true, status: true, createdAt: true, updatedAt: true, lastMeaningfulContactAt: true,
      projects: {
        where: { deletedAt: null, ...(request.projectId ? { id: request.projectId } : {}) },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, name: true, createdAt: true, updatedAt: true,
        },
      },
    },
  });
  if (!client) throw new Error("Não foram encontrados dados estruturados associados ao pedido.");

  return {
    exportType: "structured-access-review",
    generatedAt: new Date().toISOString(),
    request: {
      id: request.id,
      type: request.type,
      requesterName: request.requesterName,
      requesterEmail: request.requesterEmail,
      receivedAt: request.receivedAt,
      verifiedAt: request.identityVerifiedAt,
    },
    dataSubject: client,
    identityLinkageReviewRequired:
      request.requesterName.trim().toLowerCase() !== client.name.trim().toLowerCase() ||
      request.requesterEmail.trim().toLowerCase() !== client.email?.trim().toLowerCase(),
    scopeNotice: "Pré-visualização estruturada para revisão humana, não resposta final. Não inclui notas internas, revisões de briefing em texto livre, anexos, logs, dados de terceiros, dados de leads recolhidos para clientes, nem cópias em fornecedores/backups. Confirma e complementa o âmbito antes de responder ao titular.",
    excludedCategoriesForManualReview: ["notas internas e base de conhecimento", "respostas e revisões de briefing", "propostas, reuniões e materiais/anexos", "logs e cópias/exports", "dados tratados por fornecedores e backups", "dados de terceiros ou de leads do site do cliente"],
  };
}
