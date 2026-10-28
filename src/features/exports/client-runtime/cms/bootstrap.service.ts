import "server-only";

import { createHash } from "node:crypto";
import { hash } from "argon2";
import { z } from "zod";

import { capabilitiesFromPinnedSnapshot } from "./capabilities";
import { withClientCmsTransaction } from "./database";

const jsonSchema: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string(), z.number().finite(), z.boolean(), z.null(),
  z.array(jsonSchema), z.record(z.string(), jsonSchema),
]));

const snapshotSchema = z.object({
  formatVersion: z.literal(1),
  templateVersion: z.string().min(1),
  sourcePageId: z.string().min(1),
  templateKey: z.string().min(1),
  variantKey: z.string().min(1),
  page: z.object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200),
    theme: z.record(z.string(), jsonSchema).nullable(),
    sections: z.array(z.object({
      sectionKey: z.string().min(1).max(120), sectionType: z.string().min(1).max(120),
      name: z.string().max(200), sortOrder: z.number().int(), isVisible: z.boolean(),
      content: z.record(z.string(), jsonSchema), settings: z.record(z.string(), jsonSchema),
    }).strict()).max(100),
    forms: z.array(z.object({
      name: z.string().min(1).max(200), key: z.string().min(1).max(120), type: z.string().min(1).max(80),
      successMessage: z.string().max(500), errorMessage: z.string().max(500),
      gdprConsentRequired: z.boolean().optional(), gdprConsentLabel: z.string().optional(), gdprConsentVersion: z.string().optional(),
      fields: z.array(z.object({
        label: z.string().max(200), name: z.string().min(1).max(120), type: z.string().min(1).max(80),
        placeholder: z.string().nullable(), helpText: z.string().nullable(), defaultValue: z.string().nullable(),
        options: jsonSchema, validation: jsonSchema, conditionalLogic: jsonSchema,
        sortOrder: z.number().int(), isRequired: z.boolean(), isVisible: z.boolean(),
      }).strict()).max(100),
    }).strict()).max(30),
    seoSetting: z.record(z.string(), jsonSchema).nullable(),
  }).strict(),
  capabilities: z.object({
    sectionTypes: z.array(z.string()),
    sections: z.array(z.object({ key: z.string(), type: z.string(), editableFields: z.array(z.string()) }).strict()),
    forms: z.array(z.object({ key: z.string(), fields: z.array(z.string()) }).strict()),
  }).strict(),
}).strict();

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("O snapshot contém dados não serializáveis.");
  return encoded;
}

export async function bootstrapClientCmsInstallation(input: {
  projectId: string;
  sourceChecksum: string;
  snapshot: unknown;
}) {
  const projectId = z.string().uuid().parse(input.projectId);
  const sourceChecksum = z.string().regex(/^[a-f0-9]{64}$/).parse(input.sourceChecksum);
  const snapshot = snapshotSchema.parse(input.snapshot);
  const actualChecksum = createHash("sha256").update(canonicalJson(snapshot)).digest("hex");
  if (actualChecksum !== sourceChecksum) throw new Error("O checksum do snapshot não corresponde ao conteúdo recebido.");
  const capabilities = capabilitiesFromPinnedSnapshot(snapshot);
  const expectedVersion = `${snapshot.templateKey}/${snapshot.variantKey}@`;
  if (!snapshot.templateVersion.startsWith(expectedVersion)) throw new Error("A versão fixada não corresponde ao template e à variante do snapshot.");

  return withClientCmsTransaction(async (client) => {
    const existing = await client.query(
      `SELECT template_version, source_checksum FROM lf_cms_installations WHERE project_id = $1 FOR UPDATE`,
      [projectId],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].template_version !== snapshot.templateVersion || existing.rows[0].source_checksum !== sourceChecksum) {
        throw new Error("A instalação já existe com outra versão; a atualização exige processo explícito de rebase.");
      }
      return { created: false, projectId, templateVersion: snapshot.templateVersion };
    }

    await client.query(
      `INSERT INTO lf_cms_installations(project_id, template_key, variant_key, template_version, source_checksum, capabilities)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [projectId, snapshot.templateKey, snapshot.variantKey, snapshot.templateVersion, sourceChecksum, JSON.stringify(capabilities.capabilities)],
    );
    const pageResult = await client.query(
      `INSERT INTO lf_cms_pages(project_id, slug, title, theme, seo)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb) RETURNING id`,
      [projectId, snapshot.page.slug, snapshot.page.title, JSON.stringify(snapshot.page.theme ?? {}), JSON.stringify(snapshot.page.seoSetting ?? {})],
    );
    const pageId = pageResult.rows[0].id as string;
    for (const section of snapshot.page.sections) {
      await client.query(
        `INSERT INTO lf_cms_sections(project_id, page_id, section_key, section_type, name, sort_order, is_visible, content, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)`,
        [projectId, pageId, section.sectionKey, section.sectionType, section.name, section.sortOrder, section.isVisible, JSON.stringify(section.content), JSON.stringify(section.settings)],
      );
    }
    for (const form of snapshot.page.forms) {
      const formResult = await client.query(
        `INSERT INTO lf_cms_forms(project_id, page_id, form_key, name, form_type, is_active, success_message, error_message, consent_required, consent_label, consent_version)
         VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, $9, $10) RETURNING id`,
        [projectId, pageId, form.key, form.name, form.type, form.successMessage, form.errorMessage,
          form.gdprConsentRequired ?? true, form.gdprConsentLabel ?? "Li e aceito a Política de Privacidade.", form.gdprConsentVersion ?? "1.0"],
      );
      for (const field of form.fields) {
        await client.query(
          `INSERT INTO lf_cms_form_fields(project_id, form_id, field_name, label, field_type, is_required, is_visible, sort_order, configuration)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
          [projectId, formResult.rows[0].id, field.name, field.label, field.type, field.isRequired, field.isVisible, field.sortOrder,
            JSON.stringify({ placeholder: field.placeholder, helpText: field.helpText, defaultValue: field.defaultValue, options: field.options, validation: field.validation, conditionalLogic: field.conditionalLogic })],
        );
      }
    }
    await client.query(
      `INSERT INTO lf_cms_audit_events(project_id, action, resource_type)
       VALUES ($1, 'installation.bootstrap', 'installation')`,
      [projectId],
    );
    return { created: true, projectId, pageId, templateVersion: snapshot.templateVersion };
  });
}

export async function createInitialClientCmsAdmin(input: {
  projectId: string;
  name: string;
  email: string;
  password: string;
}) {
  const parsed = z.object({
    projectId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    password: z.string().min(12).max(200),
  }).strict().parse(input);
  if (parsed.projectId !== process.env.CLIENT_CMS_PROJECT_ID) throw new Error("O administrador não corresponde ao Project desta instalação.");
  const passwordHash = await hash(parsed.password, { type: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  return withClientCmsTransaction(async (client) => {
    const installation = await client.query("SELECT 1 FROM lf_cms_installations WHERE project_id = $1", [parsed.projectId]);
    if (!installation.rows[0]) throw new Error("Provisiona primeiro a instalação CMS.");
    const users = await client.query("SELECT count(*)::int AS count FROM lf_cms_users WHERE project_id = $1", [parsed.projectId]);
    if (Number(users.rows[0].count) !== 0) return { created: false as const };
    const result = await client.query(
      `INSERT INTO lf_cms_users(project_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'client_admin') RETURNING id, email, role`,
      [parsed.projectId, parsed.name, parsed.email, passwordHash],
    );
    await client.query(
      `INSERT INTO lf_cms_audit_events(project_id, actor_user_id, action, resource_type, resource_id)
       VALUES ($1, $2, 'user.bootstrap', 'user', $2)`,
      [parsed.projectId, result.rows[0].id],
    );
    return { created: true as const, ...result.rows[0] };
  });
}
