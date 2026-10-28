import "server-only";

import { z } from "zod";

import type { ClientRuntimePayload } from "../contracts";
import { getClientCmsPool } from "./database";

const safeColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
const publicThemeSchema = z.object({
  primaryColor: safeColor,
  secondaryColor: safeColor,
  accentColor: safeColor,
  backgroundColor: safeColor,
  surfaceColor: safeColor,
  textPrimaryColor: safeColor,
  textSecondaryColor: safeColor,
  headingFont: z.string().min(1).max(80),
  bodyFont: z.string().min(1).max(80),
  borderRadius: z.string().min(1).max(40),
}).strict();

export async function getPublishedClientCmsPayload(): Promise<ClientRuntimePayload | null> {
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  if (!projectId) throw new Error("CLIENT_CMS_PROJECT_ID não está configurado.");
  const result = await getClientCmsPool().query(
    `SELECT i.template_key, i.variant_key, i.template_version,
            p.id, p.title, p.slug, p.theme, p.seo,
            COALESCE(jsonb_agg(jsonb_build_object(
              'sectionKey', s.section_key, 'sectionType', s.section_type, 'name', s.name,
              'sortOrder', s.sort_order, 'content', s.content, 'settings', s.settings
            ) ORDER BY s.sort_order) FILTER (WHERE s.id IS NOT NULL AND s.is_visible), '[]'::jsonb) AS sections
       FROM lf_cms_installations i
       JOIN lf_cms_pages p ON p.project_id = i.project_id AND p.status = 'published'
       LEFT JOIN lf_cms_sections s ON s.project_id = p.project_id AND s.page_id = p.id
      WHERE i.project_id = $1
      GROUP BY i.project_id, p.id
      ORDER BY p.updated_at DESC LIMIT 1`,
    [projectId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const expectedVersion = process.env.CLIENT_CMS_TEMPLATE_VERSION;
  if (expectedVersion && expectedVersion !== row.template_version) {
    throw new Error("A página publicada não corresponde à versão do runtime instalado.");
  }
  const storedTheme = row.theme as Record<string, unknown>;
  const theme = publicThemeSchema.parse({
    primaryColor: storedTheme.primaryColor,
    secondaryColor: storedTheme.secondaryColor,
    accentColor: storedTheme.accentColor,
    backgroundColor: storedTheme.backgroundColor,
    surfaceColor: storedTheme.surfaceColor,
    textPrimaryColor: storedTheme.textPrimaryColor,
    textSecondaryColor: storedTheme.textSecondaryColor,
    headingFont: storedTheme.headingFont,
    bodyFont: storedTheme.bodyFont,
    borderRadius: storedTheme.borderRadius,
  });
  const formsResult = await getClientCmsPool().query(
    `SELECT f.name, f.form_key, f.form_type, f.success_message, f.error_message, f.consent_required, f.consent_label, f.consent_version,
            COALESCE(jsonb_agg(jsonb_build_object(
              'label', ff.label, 'name', ff.field_name, 'type', ff.field_type,
              'placeholder', ff.configuration->'placeholder', 'helpText', ff.configuration->'helpText',
              'defaultValue', ff.configuration->'defaultValue', 'options', ff.configuration->'options',
              'validation', ff.configuration->'validation', 'conditionalLogic', ff.configuration->'conditionalLogic',
              'isRequired', ff.is_required
            ) ORDER BY ff.sort_order) FILTER (WHERE ff.id IS NOT NULL AND ff.is_visible), '[]'::jsonb) AS fields
       FROM lf_cms_forms f
       LEFT JOIN lf_cms_form_fields ff ON ff.project_id = f.project_id AND ff.form_id = f.id
      WHERE f.project_id = $1 AND f.page_id = $2 AND f.is_active = true
      GROUP BY f.id ORDER BY f.created_at`,
    [projectId, row.id],
  );
  return {
    format: "landingforge-client-runtime",
    formatVersion: 1,
    templateVersion: String(row.template_version),
    templateKey: String(row.template_key),
    variantKey: String(row.variant_key),
    page: {
      title: String(row.title),
      slug: String(row.slug),
      theme,
      sections: row.sections,
      forms: formsResult.rows.map((form) => ({
        name: String(form.name),
        key: String(form.form_key),
        type: String(form.form_type),
        successMessage: String(form.success_message),
        errorMessage: String(form.error_message),
        gdprConsentRequired: Boolean(form.consent_required),
        gdprConsentLabel: String(form.consent_label),
        gdprConsentVersion: String(form.consent_version),
        fields: form.fields,
      })),
      seo: row.seo,
    },
  } as ClientRuntimePayload;
}
