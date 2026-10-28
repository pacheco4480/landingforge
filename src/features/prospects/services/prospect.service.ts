import { ClientStatus, ProspectSourceType, ProspectStatus, ProspectSuppressionType, Prisma } from "@/generated/prisma/client";
import { buildApprovedPublicDemoUrl, findTemplatePlaceholders, getProspectCopyBlockReason, normalizeBusinessDomain, normalizeEmailDomain, normalizeProspectEmail, normalizeSuppressionValue, prospectCsvRowSchema, sanitizeProspectCsvPreviewRow, type ProspectCsvRow } from "@/features/prospects/prospect-utils";
import { prospectSchema, prospectEmailTemplateSchema, prospectDraftSchema, prospectSuppressionSchema } from "@/features/prospects/schemas/prospect.schema";
import { publicPortfolioWhere } from "@/features/portfolio/policies/public-portfolio.policy";
import { db } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 40;

function optional(value?: string | null) {
  return value?.trim() || null;
}

function dateOnly(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function prospectSuppressionMatchWhere(type: ProspectSuppressionType, value: string): Prisma.ProspectWhereInput {
  return type === ProspectSuppressionType.EMAIL
    ? { normalizedEmail: value }
    : { OR: [{ normalizedDomain: value }, { normalizedEmail: { endsWith: `@${value}`, mode: "insensitive" } }] };
}

async function isSuppressed(tx: Prisma.TransactionClient, email: string | null, domain: string | null) {
  const emailDomain = normalizeEmailDomain(email);
  if (!email && !domain && !emailDomain) return false;
  const clauses: Prisma.ProspectSuppressionWhereInput[] = [];
  if (email) clauses.push({ type: ProspectSuppressionType.EMAIL, normalizedValue: email });
  for (const currentDomain of new Set([domain, emailDomain].filter((value): value is string => Boolean(value)))) {
    clauses.push({ type: ProspectSuppressionType.DOMAIN, normalizedValue: currentDomain });
  }
  return Boolean(await tx.prospectSuppression.findFirst({ where: { OR: clauses }, select: { id: true } }));
}

function prospectData(input: unknown) {
  const data = prospectSchema.parse(input);
  const email = normalizeProspectEmail(data.email);
  const domain = normalizeBusinessDomain(data.website);
  return {
    businessName: data.businessName,
    contactName: optional(data.contactName),
    email,
    normalizedEmail: email,
    phone: optional(data.phone),
    industry: optional(data.industry),
    locality: optional(data.locality),
    website: optional(data.website),
    normalizedDomain: domain,
    publicProfileUrl: optional(data.publicProfileUrl),
    sourceUrl: optional(data.sourceUrl),
    collectedAt: data.collectedAt ? new Date(data.collectedAt) : new Date(),
    verifiedAt: dateOnly(data.verifiedAt),
    lastMeaningfulContactAt: dateOnly(data.lastMeaningfulContactAt),
    businessSignals: data.businessSignals,
    factualNotes: optional(data.factualNotes),
    qualificationReason: optional(data.qualificationReason),
    nextFollowUpAt: dateOnly(data.nextFollowUpAt),
    status: data.status,
    emailForSuppressionCheck: email,
    domainForSuppressionCheck: domain,
  };
}

export async function listProspects(filters: { q?: string; industry?: string; locality?: string; signal?: string; status?: ProspectStatus; page?: number }) {
  const where: Prisma.ProspectWhereInput = {
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.industry ? { industry: { contains: filters.industry, mode: "insensitive" } } : {}),
    ...(filters.locality ? { locality: { contains: filters.locality, mode: "insensitive" } } : {}),
    ...(filters.signal ? { businessSignals: { has: filters.signal } } : {}),
    ...(filters.q ? { OR: [
      { businessName: { contains: filters.q, mode: "insensitive" } },
      { contactName: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { website: { contains: filters.q, mode: "insensitive" } },
    ] } : {}),
  };
  const pageSize = DEFAULT_PAGE_SIZE;
  const total = await db.prospect.count({ where });
  const totalPages = Math.ceil(total / pageSize);
  const page = Math.min(filters.page ?? 1, Math.max(totalPages, 1));
  const prospects = await db.prospect.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { businessName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, businessName: true, contactName: true, email: true, industry: true, locality: true, website: true, status: true, updatedAt: true, sourceType: true, convertedClient: { select: { id: true, businessName: true } } },
    });
  return { prospects, total, page, pageSize, totalPages };
}

export async function getProspectDetail(id: string) {
  return db.prospect.findFirst({
    where: { id, deletedAt: null },
    include: {
      convertedClient: { select: { id: true, businessName: true } },
      outreachDrafts: { orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, recipient: true, subjectSnapshot: true, bodySnapshot: true, manualExportedAt: true, createdAt: true, updatedAt: true } },
    },
  });
}

export async function createProspect(input: unknown, userId: string) {
  const data = prospectData(input);
  const { emailForSuppressionCheck, domainForSuppressionCheck, ...fields } = data;
  return db.$transaction(async (tx) => {
    const suppressed = await isSuppressed(tx, emailForSuppressionCheck, domainForSuppressionCheck);
    if (fields.status === ProspectStatus.DO_NOT_CONTACT && !suppressed) {
      const values = [
        ...(fields.normalizedEmail ? [{ type: ProspectSuppressionType.EMAIL, value: fields.normalizedEmail }] : []),
        ...(fields.normalizedDomain ? [{ type: ProspectSuppressionType.DOMAIN, value: fields.normalizedDomain }] : []),
      ];
      if (!values.length) throw new Error("Indica um email ou website para registar uma supressão global.");
      for (const item of values) await tx.prospectSuppression.upsert({ where: { normalizedValue: item.value }, update: {}, create: { type: item.type, value: item.value, normalizedValue: item.value, reason: "Pedido de não contacto registado pelo operador", createdById: userId } });
    }
    const prospect = await tx.prospect.create({
      data: {
        ...fields,
        status: suppressed ? ProspectStatus.DO_NOT_CONTACT : fields.status,
        sourceType: ProspectSourceType.MANUAL,
        createdById: userId,
        assignedToId: userId,
      },
    });
    await tx.auditLog.create({ data: { userId, action: "prospect.create", entityType: "prospect", entityId: prospect.id, newValues: { sourceType: prospect.sourceType, status: prospect.status } } });
    return prospect;
  });
}

export async function updateProspect(id: string, input: unknown, userId: string) {
  const parsed = prospectSchema.parse(input);
  if (parsed.id !== id) throw new Error("O identificador do prospect não corresponde ao pedido.");
  const data = prospectData(parsed);
  const { emailForSuppressionCheck, domainForSuppressionCheck, ...fields } = data;
  return db.$transaction(async (tx) => {
    const existing = await tx.prospect.findFirstOrThrow({ where: { id, deletedAt: null }, select: { id: true, status: true } });
    const suppressed = await isSuppressed(tx, emailForSuppressionCheck, domainForSuppressionCheck);
    if (fields.status === ProspectStatus.DO_NOT_CONTACT && !suppressed) {
      const values = [
        ...(fields.normalizedEmail ? [{ type: ProspectSuppressionType.EMAIL, value: fields.normalizedEmail }] : []),
        ...(fields.normalizedDomain ? [{ type: ProspectSuppressionType.DOMAIN, value: fields.normalizedDomain }] : []),
      ];
      if (!values.length) throw new Error("Indica um email ou website para registar uma supressão global.");
      for (const item of values) await tx.prospectSuppression.upsert({ where: { normalizedValue: item.value }, update: {}, create: { type: item.type, value: item.value, normalizedValue: item.value, reason: "Pedido de não contacto registado pelo operador", createdById: userId } });
    }
    const prospect = await tx.prospect.update({
      where: { id: existing.id },
      data: {
        ...fields,
        status: suppressed ? ProspectStatus.DO_NOT_CONTACT : fields.status,
      },
    });
    await tx.auditLog.create({ data: { userId, action: "prospect.update", entityType: "prospect", entityId: id, oldValues: { status: existing.status }, newValues: { status: prospect.status } } });
    return prospect;
  });
}

export async function setProspectStatus(id: string, status: ProspectStatus, userId: string) {
  return db.$transaction(async (tx) => {
    const prospect = await tx.prospect.findFirstOrThrow({ where: { id, deletedAt: null }, select: { id: true, status: true, normalizedEmail: true, normalizedDomain: true } });
    if (prospect.status === ProspectStatus.DO_NOT_CONTACT && status !== ProspectStatus.DO_NOT_CONTACT) {
      throw new Error("A supressão não pode ser removida através do estado do prospect.");
    }
    if (status === ProspectStatus.DO_NOT_CONTACT) {
      const values = [
        ...(prospect.normalizedEmail ? [{ type: ProspectSuppressionType.EMAIL, value: prospect.normalizedEmail }] : []),
        ...(prospect.normalizedDomain ? [{ type: ProspectSuppressionType.DOMAIN, value: prospect.normalizedDomain }] : []),
      ];
      if (!values.length) throw new Error("Sem email ou domínio não é possível criar uma supressão global.");
      for (const item of values) {
        await tx.prospectSuppression.upsert({ where: { normalizedValue: item.value }, update: {}, create: { type: item.type, value: item.value, normalizedValue: item.value, reason: "Pedido de não contacto registado pelo operador", createdById: userId } });
      }
    }
    const nextStatus = status === ProspectStatus.DO_NOT_CONTACT ? status : await isSuppressed(tx, prospect.normalizedEmail, prospect.normalizedDomain) ? ProspectStatus.DO_NOT_CONTACT : status;
    await tx.prospect.update({ where: { id }, data: { status: nextStatus } });
    await tx.auditLog.create({ data: { userId, action: "prospect.status.update", entityType: "prospect", entityId: id, oldValues: { status: prospect.status }, newValues: { status: nextStatus } } });
  });
}

export async function deleteProspect(id: string, userId: string) {
  return db.$transaction(async (tx) => {
    const prospect = await tx.prospect.findFirstOrThrow({
      where: { id, deletedAt: null },
      select: { id: true, convertedClientId: true },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "prospect.delete",
        entityType: "prospect",
        entityId: prospect.id,
        newValues: { convertedClientId: prospect.convertedClientId, deletion: "operator_requested" },
      },
    });
    await tx.prospect.delete({ where: { id: prospect.id } });
  });
}

export async function suppressProspect(input: unknown, userId: string) {
  const data = prospectSuppressionSchema.parse(input);
  const normalizedValue = normalizeSuppressionValue(data.type, data.value);
  if (!normalizedValue) throw new Error("O valor de supressão não é válido.");
  return db.$transaction(async (tx) => {
    const suppression = await tx.prospectSuppression.upsert({
      where: { normalizedValue },
      update: { reason: data.reason },
      create: { type: data.type, value: normalizedValue, normalizedValue, reason: data.reason, createdById: userId },
    });
    const matches = await tx.prospect.findMany({ where: { deletedAt: null, ...prospectSuppressionMatchWhere(data.type, normalizedValue) }, select: { id: true } });
    if (matches.length) await tx.prospect.updateMany({ where: { id: { in: matches.map((item) => item.id) } }, data: { status: ProspectStatus.DO_NOT_CONTACT } });
    await tx.auditLog.create({ data: { userId, action: "prospect.suppression.create", entityType: "prospect_suppression", entityId: suppression.id, newValues: { type: suppression.type, matchedProspects: matches.length } } });
    return { suppression, matchedProspects: matches.length };
  });
}

export async function getProspectSuppressions() {
  return db.prospectSuppression.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { id: true, type: true, value: true, reason: true, createdAt: true } });
}

export async function previewProspectImport(rows: unknown[]) {
  if (rows.length > 500) throw new Error("Podes importar até 500 registos de cada vez.");
  const checked = rows.map((row, index) => {
    const result = prospectCsvRowSchema.safeParse(row);
    return result.success ? { line: index + 2, row: result.data, error: null as string | null, duplicateOf: null as number | null, suppressed: false } : { line: index + 2, row: sanitizeProspectCsvPreviewRow(row), error: result.error.issues[0]?.message ?? "Dados inválidos.", duplicateOf: null, suppressed: false };
  });
  const emailLines = new Map<string, number>();
  const domainLines = new Map<string, number>();
  const validRows = checked.filter((item): item is typeof item & { row: ProspectCsvRow; error: null } => item.error === null);
  for (const item of validRows) {
    const email = normalizeProspectEmail(item.row.email);
    const domain = normalizeBusinessDomain(item.row.website);
    const duplicate = (email ? emailLines.get(email) : undefined) ?? (domain ? domainLines.get(domain) : undefined);
    if (duplicate) item.duplicateOf = duplicate;
    else {
      if (email) emailLines.set(email, item.line);
      if (domain) domainLines.set(domain, item.line);
    }
  }
  const emails = [...emailLines.keys()];
  const domains = [...domainLines.keys()];
  const emailDomains = emails.map(normalizeEmailDomain).filter((value): value is string => Boolean(value));
  const [existing, suppressions] = await Promise.all([
    db.prospect.findMany({ where: { deletedAt: null, OR: [...(emails.length ? [{ normalizedEmail: { in: emails } }] : []), ...(domains.length ? [{ normalizedDomain: { in: domains } }] : [])] }, select: { normalizedEmail: true, normalizedDomain: true } }),
    db.prospectSuppression.findMany({ where: { OR: [...(emails.length ? [{ type: ProspectSuppressionType.EMAIL, normalizedValue: { in: emails } }] : []), ...([...domains, ...emailDomains].length ? [{ type: ProspectSuppressionType.DOMAIN, normalizedValue: { in: [...domains, ...emailDomains] } }] : [])] }, select: { type: true, normalizedValue: true } }),
  ]);
  const existingEmails = new Set(existing.map((item) => item.normalizedEmail).filter(Boolean));
  const existingDomains = new Set(existing.map((item) => item.normalizedDomain).filter(Boolean));
  const suppressedEmails = new Set(suppressions.filter((item) => item.type === ProspectSuppressionType.EMAIL).map((item) => item.normalizedValue));
  const suppressedDomains = new Set(suppressions.filter((item) => item.type === ProspectSuppressionType.DOMAIN).map((item) => item.normalizedValue));
  for (const item of validRows) {
    const email = normalizeProspectEmail(item.row.email);
    const domain = normalizeBusinessDomain(item.row.website);
    const emailDomain = normalizeEmailDomain(email);
    item.suppressed = Boolean((email && suppressedEmails.has(email)) || (domain && suppressedDomains.has(domain)) || (emailDomain && suppressedDomains.has(emailDomain)));
    if (!item.duplicateOf && ((email && existingEmails.has(email)) || (domain && existingDomains.has(domain)))) item.duplicateOf = 0;
  }
  return { rows: checked, accepted: checked.filter((item) => !item.error && item.duplicateOf === null && !item.suppressed).length, rejected: checked.filter((item) => Boolean(item.error || item.duplicateOf || item.suppressed)).length };
}

export async function importProspects(rows: unknown[], userId: string) {
  const preview = await previewProspectImport(rows);
  const importable = preview.rows.filter((item) => !item.error && item.duplicateOf === null && !item.suppressed).map((item) => prospectCsvRowSchema.parse(item.row));
  if (!importable.length) return { imported: 0, rejected: preview.rejected, rejectedLines: preview.rows.filter((row) => row.error || row.duplicateOf || row.suppressed).map(({ line, error, duplicateOf, suppressed }) => ({ line, reason: error ?? (suppressed ? "Contacto abrangido por supressão." : duplicateOf === 0 ? "Já existe um prospect com este email/domínio." : `Duplicado da linha ${duplicateOf}.`) })) };
  await db.$transaction(async (tx) => {
    const emails = importable.map((row) => normalizeProspectEmail(row.email)).filter((value): value is string => Boolean(value));
    const domains = importable.map((row) => normalizeBusinessDomain(row.website)).filter((value): value is string => Boolean(value));
    const emailDomains = emails.map((email) => normalizeEmailDomain(email)).filter((value): value is string => Boolean(value));
    const [existing, suppressed] = await Promise.all([
      tx.prospect.findFirst({ where: { deletedAt: null, OR: [...(emails.length ? [{ normalizedEmail: { in: emails } }] : []), ...(domains.length ? [{ normalizedDomain: { in: domains } }] : [])] }, select: { id: true } }),
      tx.prospectSuppression.findFirst({ where: { OR: [...(emails.length ? [{ type: ProspectSuppressionType.EMAIL, normalizedValue: { in: emails } }] : []), ...([...domains, ...emailDomains].length ? [{ type: ProspectSuppressionType.DOMAIN, normalizedValue: { in: [...domains, ...emailDomains] } }] : [])] }, select: { id: true } }),
    ]);
    if (existing || suppressed) throw new Error("Os dados mudaram após a pré-visualização. Nada foi gravado; volta a validar o CSV.");
    for (const row of importable) {
      const email = normalizeProspectEmail(row.email);
      const domain = normalizeBusinessDomain(row.website);
      await tx.prospect.create({ data: {
        businessName: row.businessName,
        contactName: optional(row.contactName), email, normalizedEmail: email,
        phone: optional(row.phone), industry: optional(row.industry), locality: optional(row.locality),
        website: optional(row.website), normalizedDomain: domain,
        publicProfileUrl: optional(row.publicProfileUrl), sourceType: ProspectSourceType.CSV,
        sourceUrl: optional(row.sourceUrl), factualNotes: optional(row.factualNotes),
        status: ProspectStatus.NEW, createdById: userId, assignedToId: userId,
      } });
    }
    await tx.auditLog.create({ data: { userId, action: "prospect.csv.import", entityType: "prospect_import", newValues: { imported: importable.length, rejected: preview.rejected } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return { imported: importable.length, rejected: preview.rejected, rejectedLines: preview.rows.filter((row) => row.error || row.duplicateOf || row.suppressed).map(({ line, error, duplicateOf, suppressed }) => ({ line, reason: error ?? (suppressed ? "Contacto abrangido por supressão." : duplicateOf === 0 ? "Já existe um prospect com este email/domínio." : `Duplicado da linha ${duplicateOf}.`) })) };
}

export async function convertProspectToClient(id: string, userId: string) {
  return db.$transaction(async (tx) => {
    const prospect = await tx.prospect.findFirstOrThrow({ where: { id, deletedAt: null }, select: { id: true, businessName: true, contactName: true, email: true, normalizedEmail: true, phone: true, industry: true, website: true, status: true, convertedClientId: true } });
    if (prospect.convertedClientId) return { clientId: prospect.convertedClientId, created: false };
    const prospectDomain = normalizeBusinessDomain(prospect.website);
    const existingClientCandidates = await tx.client.findMany({
      where: { deletedAt: null, OR: [...(prospect.email ? [{ email: { equals: prospect.email, mode: "insensitive" as const } }] : []), ...(prospectDomain ? [{ website: { contains: prospectDomain } }] : [])] },
      select: { id: true, email: true, website: true },
      take: 100,
    });
    const existingClient = existingClientCandidates.find((candidate) =>
      (prospect.normalizedEmail && normalizeProspectEmail(candidate.email) === prospect.normalizedEmail)
      || (prospectDomain && normalizeBusinessDomain(candidate.website) === prospectDomain),
    );
    const client = existingClient ?? await tx.client.create({ data: {
      name: prospect.contactName ?? prospect.businessName,
      businessName: prospect.businessName,
      industry: prospect.industry,
      website: prospect.website,
      email: prospect.email,
      phone: prospect.phone,
      status: ClientStatus.LEAD,
    }, select: { id: true } });
    await tx.prospect.update({ where: { id }, data: { convertedClientId: client.id, status: ProspectStatus.CONVERTED } });
    await tx.auditLog.create({ data: { userId, action: "prospect.convert", entityType: "prospect", entityId: id, newValues: { clientId: client.id, createdClient: !existingClient } } });
    return { clientId: client.id, created: !existingClient };
  });
}

export async function listProspectTemplates() {
  return db.prospectEmailTemplate.findMany({ where: { isActive: true }, orderBy: [{ industry: "asc" }, { name: "asc" }], include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
}

export async function saveProspectTemplate(input: unknown, userId: string) {
  const data = prospectEmailTemplateSchema.parse(input);
  const values = { name: data.name, industry: optional(data.industry), purpose: data.purpose, locale: data.locale };
  return db.$transaction(async (tx) => {
    const template = data.id
      ? await tx.prospectEmailTemplate.update({ where: { id: data.id }, data: values })
      : await tx.prospectEmailTemplate.create({ data: { ...values, createdById: userId } });
    const latest = await tx.prospectEmailTemplateVersion.findFirst({ where: { templateId: template.id }, orderBy: { version: "desc" }, select: { version: true, subject: true, body: true } });
    if (!latest || latest.subject !== data.subject || latest.body !== data.body) {
      await tx.prospectEmailTemplateVersion.create({ data: { templateId: template.id, version: (latest?.version ?? 0) + 1, subject: data.subject, body: data.body } });
    }
    await tx.auditLog.create({ data: { userId, action: data.id ? "prospect.template.update" : "prospect.template.create", entityType: "prospect_email_template", entityId: template.id, newValues: { version: (latest?.version ?? 0) + (latest?.subject === data.subject && latest.body === data.body ? 0 : 1) } } });
    return template;
  });
}

export async function getApprovedProspectDemos() {
  return db.page.findMany({ where: publicPortfolioWhere, select: { slug: true, title: true }, orderBy: [{ portfolioOrder: "asc" }, { title: "asc" }], take: 80 });
}

export async function saveProspectDraft(input: unknown, userId: string) {
  const data = prospectDraftSchema.parse(input);
  return db.$transaction(async (tx) => {
    const prospect = await tx.prospect.findFirstOrThrow({ where: { id: data.prospectId, deletedAt: null }, select: { id: true, status: true, email: true, normalizedEmail: true, normalizedDomain: true, businessName: true, contactName: true, locality: true, industry: true, website: true } });
    if (prospect.status === ProspectStatus.DO_NOT_CONTACT || await isSuppressed(tx, prospect.normalizedEmail, prospect.normalizedDomain)) throw new Error("Este contacto está suprimido e não pode receber uma mensagem exportada.");
    const recipient = normalizeProspectEmail(prospect.email);
    if (!recipient) throw new Error("Adiciona um email profissional antes de preparar o rascunho.");
    const suppression = await tx.prospectSuppression.findFirst({ where: { type: ProspectSuppressionType.EMAIL, normalizedValue: recipient }, select: { id: true } });
    if (suppression) throw new Error("Este endereço está na lista de supressão.");
    let publicDemoUrl = "";
    if (data.publicDemoSlug) {
      const page = await tx.page.findFirst({ where: { ...publicPortfolioWhere, slug: data.publicDemoSlug }, select: { slug: true } });
      if (!page) throw new Error("A demo selecionada não está aprovada para publicação.");
      publicDemoUrl = buildApprovedPublicDemoUrl(process.env.NEXT_PUBLIC_SITE_URL, page.slug) ?? "";
      if (!publicDemoUrl) throw new Error("Define um domínio HTTPS público. Links locais ou não seguros não podem ser incluídos em contactos comerciais.");
    }
    const fields = { businessName: prospect.businessName, contactName: prospect.contactName ?? "", locality: prospect.locality ?? "", industry: prospect.industry ?? "", website: prospect.website ?? "", publicDemoUrl };
    const subject = data.subject.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g, (token, key: string) => fields[key as keyof typeof fields] || token);
    const body = data.body.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9]*)\s*\}\}/g, (token, key: string) => fields[key as keyof typeof fields] || token);
    const unresolved = [...findTemplatePlaceholders(subject), ...findTemplatePlaceholders(body)];
    if (unresolved.some((placeholder) => !["businessName", "contactName", "locality", "industry", "website", "publicDemoUrl"].includes(placeholder))) throw new Error("O modelo contém placeholders não suportados.");
    const template = data.templateId ? await tx.prospectEmailTemplate.findFirst({ where: { id: data.templateId, isActive: true }, select: { id: true } }) : null;
    if (data.templateId && !template) throw new Error("O modelo selecionado não existe ou está inativo.");
    const templateVersion = template ? await tx.prospectEmailTemplateVersion.findFirst({ where: { templateId: template.id }, orderBy: { version: "desc" }, select: { id: true } }) : null;
    const draft = await tx.prospectOutreachDraft.create({ data: { prospectId: prospect.id, templateId: data.templateId || null, templateVersionId: templateVersion?.id ?? null, authorId: userId, recipient, subjectSnapshot: subject, bodySnapshot: body } });
    await tx.auditLog.create({ data: { userId, action: "prospect.outreach.draft.create", entityType: "prospect_outreach_draft", entityId: draft.id, newValues: { prospectId: prospect.id, templateId: data.templateId || null, hasPublicDemo: Boolean(data.publicDemoSlug) } } });
    return draft;
  });
}

export type ProspectDraftExportResult =
  | { ok: false; message: string }
  | { ok: true; recipient: string | null; subject: string; body: string };

export async function markDraftManuallyExported(id: string, userId: string): Promise<ProspectDraftExportResult> {
  return db.$transaction(async (tx) => {
    const draft = await tx.prospectOutreachDraft.findFirstOrThrow({ where: { id }, include: { prospect: { select: { id: true, status: true, normalizedEmail: true, normalizedDomain: true, sourceUrl: true, verifiedAt: true } } } });
    const blockedReason = getProspectCopyBlockReason({
      status: draft.prospect.status,
      suppressed: await isSuppressed(tx, draft.prospect.normalizedEmail, draft.prospect.normalizedDomain),
      recipient: draft.recipient,
      sourceUrl: draft.prospect.sourceUrl,
      verifiedAt: draft.prospect.verifiedAt,
      subject: draft.subjectSnapshot,
      body: draft.bodySnapshot,
    });
    if (blockedReason) return { ok: false, message: blockedReason };
    await tx.prospectOutreachDraft.update({ where: { id }, data: { manualExportedAt: new Date() } });
    await tx.auditLog.create({ data: { userId, action: "prospect.outreach.manual_export", entityType: "prospect_outreach_draft", entityId: id, newValues: { prospectId: draft.prospect.id, method: "clipboard", recipientConfirmed: true, sourceAndContentReviewed: true } } });
    return { ok: true, recipient: draft.recipient, subject: draft.subjectSnapshot, body: draft.bodySnapshot };
  });
}

