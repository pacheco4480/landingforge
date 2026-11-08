import "server-only";

import { clientCmsContentPatchSchema, type AuthorizedClientCmsContext } from "./contracts";
import { getActorInstallation } from "./authorization";
import { getClientCmsPool, withClientCmsTransaction } from "./database";
import type { Pool, PoolClient } from "pg";

const repeatableLimits: Record<string, { max: number; fields: Array<{ key: string; length: number; required: boolean }> }> = {
  faq: { max: 30, fields: [{ key: "question", length: 180, required: true }, { key: "answer", length: 1200, required: true }] },
  testimonials: { max: 30, fields: [{ key: "name", length: 100, required: true }, { key: "quote", length: 700, required: true }, { key: "context", length: 120, required: false }] },
  restaurant_reviews: { max: 30, fields: [{ key: "name", length: 100, required: true }, { key: "quote", length: 700, required: true }, { key: "context", length: 120, required: false }] },
  restaurant_menu_highlights: { max: 30, fields: [{ key: "category", length: 80, required: true }, { key: "title", length: 120, required: true }, { key: "description", length: 500, required: true }, { key: "price", length: 40, required: false }] },
};

function validateRepeatableItems(sectionType: string, value: unknown) {
  const profile = sectionType === "restaurant_reviews"
    ? repeatableLimits.restaurant_reviews
    : sectionType === "restaurant_menu_highlights"
      ? repeatableLimits.restaurant_menu_highlights
      : sectionType === "faq" || sectionType.endsWith("_faq")
        ? repeatableLimits.faq
        : sectionType === "testimonials" || sectionType.endsWith("_testimonials")
          ? repeatableLimits.testimonials
          : null;
  if (!profile || !Array.isArray(value)) return;
  if (value.length > profile.max) throw new Error(`Esta secção suporta até ${profile.max} itens.`);
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`O item ${index + 1} tem um formato inválido.`);
    const record = item as Record<string, unknown>;
    for (const field of profile.fields) {
      const raw = record[field.key];
      if (raw !== undefined && typeof raw !== "string") throw new Error(`O campo ${field.key} do item ${index + 1} tem um formato inválido.`);
      const text = typeof raw === "string" ? raw.trim() : "";
      if (field.required && !text) throw new Error(`Preenche ${field.key} no item ${index + 1}.`);
      if (typeof raw === "string" && raw.length > field.length) throw new Error(`${field.key} no item ${index + 1} excede ${field.length} caracteres.`);
    }
  }
}

export async function getClientCmsPage(actor: AuthorizedClientCmsContext, pool: Pool = getClientCmsPool()) {
  const projectId = getActorInstallation(actor).projectId;
  const result = await pool.query(
    `SELECT p.id, p.slug, p.title, p.status, p.theme, p.seo, p.content_revision,
            COALESCE(jsonb_agg(jsonb_build_object(
              'id', s.id, 'sectionKey', s.section_key, 'sectionType', s.section_type,
              'name', s.name, 'sortOrder', s.sort_order, 'isVisible', s.is_visible,
              'content', s.content, 'settings', s.settings
            ) ORDER BY s.sort_order) FILTER (WHERE s.id IS NOT NULL AND s.is_visible), '[]'::jsonb) AS sections
       FROM lf_cms_pages p
       LEFT JOIN lf_cms_sections s ON s.project_id = p.project_id AND s.page_id = p.id
      WHERE p.project_id = $1
      GROUP BY p.id
      ORDER BY p.updated_at DESC LIMIT 1`,
    [projectId],
  );
  const page = result.rows[0];
  if (!page) return null;
  const visibleSectionKeys = new Set(
    (page.sections as Array<{ sectionKey: string }>).map((section) => section.sectionKey),
  );
  return {
    ...page,
    capabilities: actor.installation.capabilities.filter((capability) => visibleSectionKeys.has(capability.sectionKey)),
  };
}

export async function getClientCmsDashboard(actor: AuthorizedClientCmsContext, pool: Pool = getClientCmsPool()) {
  const projectId = getActorInstallation(actor).projectId;
  const result = await pool.query(
    `SELECT (SELECT count(*)::int FROM lf_cms_pages WHERE project_id = $1) AS pages,
            (SELECT count(*)::int FROM lf_cms_sections WHERE project_id = $1 AND is_visible = true) AS sections,
            (SELECT count(*)::int FROM lf_cms_forms WHERE project_id = $1) AS forms,
            (SELECT count(*)::int FROM lf_cms_leads WHERE project_id = $1 AND status = 'new') AS new_leads`,
    [projectId],
  );
  return {
    ...result.rows[0],
    templateKey: actor.installation.templateKey,
    variantKey: actor.installation.variantKey,
    templateVersion: actor.installation.templateVersion,
  };
}

export async function updateClientCmsSection(
  actor: AuthorizedClientCmsContext,
  input: { pageId: string; sectionId: string; content: unknown },
  transaction: typeof withClientCmsTransaction = withClientCmsTransaction,
) {
  const projectId = getActorInstallation(actor).projectId;
  const patch = clientCmsContentPatchSchema.parse(input.content);
  if (Object.keys(patch).length === 0) throw new Error("Indica pelo menos um campo para guardar.");

  return transaction(async (client: PoolClient) => {
    const sectionResult = await client.query(
      `SELECT id, page_id, section_key, section_type, content
         FROM lf_cms_sections
        WHERE project_id = $1 AND page_id = $2 AND id = $3 AND is_visible = true
        FOR UPDATE`,
      [projectId, input.pageId, input.sectionId],
    );
    const section = sectionResult.rows[0];
    if (!section) throw new Error("Secção não encontrada neste Project.");

    const capability = actor.installation.capabilities.find(
      (item) => item.sectionKey === section.section_key && item.sectionType === section.section_type,
    );
    if (!capability) throw new Error("A secção não pertence às capacidades da versão fixada.");
    const unsupportedFields = Object.keys(patch).filter((key) => !capability.editableFields.includes(key));
    if (unsupportedFields.length) throw new Error("Um ou mais campos não são editáveis nesta versão do template.");
    if (Object.hasOwn(patch, "items")) validateRepeatableItems(section.section_type, patch.items);

    const content = { ...(section.content as Record<string, unknown>), ...patch };
    await client.query(
      `UPDATE lf_cms_sections SET content = $4::jsonb, updated_at = now()
        WHERE project_id = $1 AND page_id = $2 AND id = $3`,
      [projectId, input.pageId, input.sectionId, JSON.stringify(content)],
    );
    await client.query(
      `UPDATE lf_cms_pages SET content_revision = content_revision + 1, updated_at = now()
        WHERE project_id = $1 AND id = $2`,
      [projectId, input.pageId],
    );
    await client.query(
      `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
       VALUES ($1, $2, 'section.content.update', 'section', $3)`,
      [projectId, actor.userId, input.sectionId],
    );
    return content;
  });
}

export async function getClientCmsForms(actor: AuthorizedClientCmsContext, pool: Pool = getClientCmsPool()) {
  const projectId = getActorInstallation(actor).projectId;
  const result = await pool.query(
    `SELECT f.id, f.form_key, f.name, f.is_active, f.success_message, f.error_message,
            f.consent_required, f.consent_label, f.consent_version,
            COALESCE(jsonb_agg(jsonb_build_object(
              'name', ff.field_name, 'label', ff.label, 'type', ff.field_type,
              'required', ff.is_required, 'visible', ff.is_visible, 'configuration', ff.configuration
            ) ORDER BY ff.sort_order) FILTER (WHERE ff.id IS NOT NULL), '[]'::jsonb) AS fields
       FROM lf_cms_forms f
       LEFT JOIN lf_cms_form_fields ff ON ff.project_id = f.project_id AND ff.form_id = f.id
      WHERE f.project_id = $1
      GROUP BY f.id ORDER BY f.created_at`,
    [projectId],
  );
  return result.rows;
}

export async function listClientCmsLeads(actor: AuthorizedClientCmsContext, pool: Pool = getClientCmsPool()) {
  const projectId = getActorInstallation(actor).projectId;
  const result = await pool.query(
    `SELECT id, name, email, phone, company, message, status, created_at, updated_at
       FROM lf_cms_leads WHERE project_id = $1
      ORDER BY created_at DESC LIMIT 100`,
    [projectId],
  );
  return result.rows;
}

export async function updateClientCmsLeadStatus(
  actor: AuthorizedClientCmsContext,
  leadId: string,
  status: "new" | "contacted" | "converted" | "lost",
  pool: Pool = getClientCmsPool(),
) {
  const projectId = getActorInstallation(actor).projectId;
  const result = await pool.query(
    `UPDATE lf_cms_leads SET status = $3, updated_at = now()
      WHERE project_id = $1 AND id = $2
      RETURNING id, status, updated_at`,
    [projectId, leadId, status],
  );
  if (!result.rows[0]) throw new Error("Lead não encontrado neste Project.");
  await pool.query(
    `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
     VALUES ($1, $2, 'lead.status.update', 'lead', $3)`,
    [projectId, actor.userId, leadId],
  );
  return result.rows[0];
}

function csvCell(value: unknown) {
  let text = value == null
    ? ""
    : value instanceof Date
      ? value.toISOString()
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  if (/^[\u0000-\u0020\u007f\u00a0\uFEFF]*[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildClientCmsLeadsCsv(rows: Array<Record<string, unknown>>) {
  const columns: Array<[string, (row: Record<string, unknown>) => unknown]> = [
    ["ID", (row) => row.id],
    ["Nome", (row) => row.name],
    ["Email", (row) => row.email],
    ["Telefone", (row) => row.phone],
    ["Empresa", (row) => row.company],
    ["Mensagem", (row) => row.message],
    ["Estado", (row) => row.status],
    ["Criado em", (row) => row.created_at],
    ["Atualizado em", (row) => row.updated_at],
    ["Dados do formulário", (row) => row.submission_data],
  ];
  return `\uFEFF${columns.map(([header]) => csvCell(header)).join(",")}\r\n${rows
    .map((row) => columns.map(([, value]) => csvCell(value(row))).join(","))
    .join("\r\n")}${rows.length ? "\r\n" : ""}`;
}

export async function exportClientCmsLeadsCsv(
  actor: AuthorizedClientCmsContext,
  transaction: typeof withClientCmsTransaction = withClientCmsTransaction,
) {
  const projectId = getActorInstallation(actor).projectId;
  return transaction(async (client: PoolClient) => {
    const result = await client.query(
      `SELECT l.id, l.name, l.email, l.phone, l.company, l.message, l.status, l.created_at, l.updated_at,
              s.data AS submission_data
         FROM lf_cms_leads l
         JOIN lf_cms_submissions s ON s.project_id = l.project_id AND s.id = l.submission_id
        WHERE l.project_id = $1 AND s.project_id = $1
        ORDER BY l.created_at DESC, l.id`,
      [projectId],
    );
    await client.query(
      `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type)
       VALUES ($1, $2, 'lead.export', 'lead_collection')`,
      [projectId, actor.userId],
    );
    return buildClientCmsLeadsCsv(result.rows as Array<Record<string, unknown>>);
  });
}

export async function deleteClientCmsLeadData(
  actor: AuthorizedClientCmsContext,
  leadId: string,
  confirmed: unknown,
  transaction: typeof withClientCmsTransaction = withClientCmsTransaction,
) {
  if (confirmed !== true) throw new Error("Confirma explicitamente a eliminação permanente dos dados deste contacto.");
  const projectId = getActorInstallation(actor).projectId;
  return transaction(async (client: PoolClient) => {
    const result = await client.query(
      `SELECT l.id, l.submission_id
         FROM lf_cms_leads l
         JOIN lf_cms_submissions s ON s.project_id = l.project_id AND s.id = l.submission_id
        WHERE l.project_id = $1 AND s.project_id = $1 AND l.id = $2
        FOR UPDATE OF l, s`,
      [projectId, leadId],
    );
    const lead = result.rows[0];
    if (!lead) throw new Error("Lead não encontrado neste Project.");

    const deletedLead = await client.query(
      "DELETE FROM lf_cms_leads WHERE project_id = $1 AND id = $2",
      [projectId, leadId],
    );
    if (deletedLead.rowCount !== 1) throw new Error("Lead não encontrado neste Project.");
    const deletedSubmission = await client.query(
      "DELETE FROM lf_cms_submissions WHERE project_id = $1 AND id = $2",
      [projectId, lead.submission_id],
    );
    if (deletedSubmission.rowCount !== 1) throw new Error("A submissão associada não pôde ser eliminada.");

    await client.query(
      `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
       VALUES ($1, $2, 'lead.data.delete', 'lead', $3)`,
      [projectId, actor.userId, leadId],
    );
    return { deleted: true };
  });
}

export async function setClientCmsPageStatus(
  actor: AuthorizedClientCmsContext,
  pageId: string,
  status: "draft" | "published",
  pool: Pool = getClientCmsPool(),
) {
  const projectId = getActorInstallation(actor).projectId;
  const result = await pool.query(
    `UPDATE lf_cms_pages SET status = $3, updated_at = now()
      WHERE project_id = $1 AND id = $2
      RETURNING id, slug, status, content_revision`,
    [projectId, pageId, status],
  );
  if (!result.rows[0]) throw new Error("Página não encontrada neste Project.");
  await pool.query(
    `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
     VALUES ($1, $2, 'page.status.update', 'page', $3)`,
    [projectId, actor.userId, pageId],
  );
  return result.rows[0];
}

export async function setClientCmsFormActive(
  actor: AuthorizedClientCmsContext,
  formId: string,
  isActive: boolean,
  pool: Pool = getClientCmsPool(),
) {
  const projectId = getActorInstallation(actor).projectId;
  if (isActive) {
    const fields = await pool.query(
      `SELECT count(*)::int AS count FROM lf_cms_form_fields
        WHERE project_id = $1 AND form_id = $2 AND is_visible = true`,
      [projectId, formId],
    );
    if (Number(fields.rows[0]?.count) === 0) throw new Error("O formulário precisa de pelo menos um campo visível.");
  }
  const result = await pool.query(
    `UPDATE lf_cms_forms SET is_active = $3, updated_at = now()
      WHERE project_id = $1 AND id = $2 RETURNING id, is_active`,
    [projectId, formId, isActive],
  );
  if (!result.rows[0]) throw new Error("Formulário não encontrado neste Project.");
  await pool.query(
    `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
     VALUES ($1, $2, 'form.activation.update', 'form', $3)`,
    [projectId, actor.userId, formId],
  );
  return result.rows[0];
}
