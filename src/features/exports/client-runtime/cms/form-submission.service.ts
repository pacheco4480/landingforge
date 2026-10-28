import "server-only";

import { z } from "zod";
import { createHmac } from "node:crypto";

import { getClientCmsPool, withClientCmsTransaction } from "./database";

const submissionSchema = z.object({
  formKey: z.string().min(1).max(120),
  values: z.record(z.string().max(120), z.union([z.string().max(4000), z.boolean(), z.array(z.string().max(500)).max(30)])),
  consentGiven: z.boolean(),
  consentVersion: z.string().max(40).optional(),
  honeypot: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
}).strict();

export async function submitClientCmsLead(input: unknown) {
  const parsed = submissionSchema.parse(input);
  if (parsed.honeypot?.trim()) return { ok: true as const };
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  if (!projectId) throw new Error("CLIENT_CMS_PROJECT_ID não está configurado.");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (Boolean(siteKey) !== Boolean(secretKey)) throw new Error("A proteção anti-spam está configurada de forma incompleta.");
  if (secretKey) {
    const token = parsed.turnstileToken;
    if (!token) throw new Error("A verificação anti-spam não foi concluída.");
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
      signal: AbortSignal.timeout(5000),
    }).then((response) => response.json() as Promise<{ success?: boolean }>).catch(() => ({ success: false }));
    if (!verification.success) throw new Error("A verificação anti-spam expirou. Tente novamente.");
  }

  return withClientCmsTransaction(async (client) => {
    const formResult = await client.query(
      `SELECT f.id, f.page_id, f.name, f.consent_required, f.consent_version
         FROM lf_cms_forms f
         JOIN lf_cms_installations i ON i.project_id = f.project_id
        WHERE f.project_id = $1 AND f.form_key = $2 AND f.is_active = true`,
      [projectId, parsed.formKey],
    );
    const form = formResult.rows[0];
    if (!form) throw new Error("Este formulário não está disponível.");
    if (form.consent_required && !parsed.consentGiven) throw new Error("É necessário aceitar a Política de Privacidade.");
    if (form.consent_required && parsed.consentVersion !== form.consent_version) {
      throw new Error("A versão do consentimento mudou. Atualize a página e tente novamente.");
    }

    const fieldResult = await client.query(
      `SELECT field_name, label, field_type, is_required
         FROM lf_cms_form_fields
        WHERE project_id = $1 AND form_id = $2 AND is_visible = true
        ORDER BY sort_order`,
      [projectId, form.id],
    );
    const allowed = new Map<string, { label: string; type: string; required: boolean }>(
      fieldResult.rows.map((field) => [String(field.field_name), {
        label: String(field.label), type: String(field.field_type), required: Boolean(field.is_required),
      }]),
    );
    for (const name of Object.keys(parsed.values)) {
      if (!allowed.has(name)) throw new Error("O formulário contém um campo não permitido.");
    }
    const cleanValues: Record<string, string | boolean> = {};
    for (const [name, value] of Object.entries(parsed.values)) {
      const field = allowed.get(name);
      if (!field) throw new Error("O formulário contém um campo não permitido.");
      const normalized = Array.isArray(value) ? value.join(", ") : value;
      if (field.required && (typeof normalized === "string" ? !normalized.trim() : !normalized)) {
        throw new Error("Preencha os campos obrigatórios.");
      }
      if (field.type.toLowerCase().includes("email") && typeof normalized === "string" && normalized && !z.string().email().safeParse(normalized).success) {
        throw new Error("Introduza um endereço de email válido.");
      }
      cleanValues[name] = normalized;
    }
    for (const [name, field] of allowed) {
      if (field.required && !(name in parsed.values)) throw new Error("Preencha os campos obrigatórios.");
    }

    const submission = await client.query(
      `INSERT INTO lf_cms_submissions(project_id, form_id, page_id, data, consent_given, consent_version)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6) RETURNING id`,
      [projectId, form.id, form.page_id, JSON.stringify(cleanValues), parsed.consentGiven, parsed.consentVersion ?? null],
    );
    const leadValues = Object.fromEntries(Object.entries(cleanValues).map(([name, value]) => [name.toLowerCase(), value]));
    await client.query(
      `INSERT INTO lf_cms_leads(project_id, submission_id, name, email, phone, company, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [projectId, submission.rows[0].id,
        leadValues.nome ?? leadValues.name ?? null,
        leadValues.email ?? null,
        leadValues.telefone ?? leadValues.phone ?? null,
        leadValues.empresa ?? leadValues.company ?? null,
        leadValues.mensagem ?? leadValues.message ?? null],
    );
    await client.query(
      `INSERT INTO lf_cms_audit_events(project_id, action, resource_type, resource_id)
       VALUES ($1, 'form.submission.create', 'form', $2)`,
      [projectId, form.id],
    );
    return { ok: true as const };
  });
}

export async function assertClientCmsSubmissionLimit(ipAddress: string | null | undefined) {
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  const secret = process.env.CLIENT_CMS_RATE_LIMIT_SECRET;
  if (!projectId || !secret) throw new Error("A proteção contra abuso de formulários não está configurada.");
  const normalizedAddress = ipAddress?.trim() || "unknown";
  const keyHash = createHmac("sha256", secret).update(normalizedAddress).digest("hex");
  const result = await getClientCmsPool().query(
    `INSERT INTO lf_cms_submission_limits(project_id, key_hash, window_started_at, request_count)
     VALUES ($1, $2, now(), 1)
     ON CONFLICT (project_id, key_hash) DO UPDATE SET
       request_count = CASE
         WHEN lf_cms_submission_limits.window_started_at < now() - interval '1 minute' THEN 1
         ELSE lf_cms_submission_limits.request_count + 1
       END,
       window_started_at = CASE
         WHEN lf_cms_submission_limits.window_started_at < now() - interval '1 minute' THEN now()
         ELSE lf_cms_submission_limits.window_started_at
       END
     RETURNING request_count`,
    [projectId, keyHash],
  );
  if (Number(result.rows[0]?.request_count) > 8) throw new Error("Foram enviados demasiados pedidos. Tente novamente dentro de um minuto.");
}
