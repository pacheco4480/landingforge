import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { hash } from "argon2";
import { z } from "zod";

import { getClientCmsPool, withClientCmsTransaction } from "./database";

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(12).max(200);

export async function requestClientCmsPasswordReset(rawEmail: string) {
  const parsed = emailSchema.safeParse(rawEmail);
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  const rateLimitSecret = process.env.CLIENT_CMS_RATE_LIMIT_SECRET;
  if (!parsed.success || !projectId || !rateLimitSecret) return { ok: true as const };
  const rateKey = createHmac("sha256", rateLimitSecret).update(`reset:${parsed.data}`).digest("hex");
  const rate = await getClientCmsPool().query(
    `INSERT INTO lf_cms_auth_limits(project_id, key_hash, window_started_at, request_count)
     VALUES ($1, $2, now(), 1)
     ON CONFLICT (project_id, key_hash) DO UPDATE SET
       request_count = CASE WHEN lf_cms_auth_limits.window_started_at < now() - interval '1 hour' THEN 1 ELSE lf_cms_auth_limits.request_count + 1 END,
       window_started_at = CASE WHEN lf_cms_auth_limits.window_started_at < now() - interval '1 hour' THEN now() ELSE lf_cms_auth_limits.window_started_at END
     RETURNING request_count`,
    [projectId, rateKey],
  );
  if (Number(rate.rows[0]?.request_count) > 5) return { ok: true as const };

  const user = await getClientCmsPool().query(
    `SELECT id, email FROM lf_cms_users WHERE project_id = $1 AND email = $2 AND is_active = true`,
    [projectId, parsed.data],
  );
  if (!user.rows[0]) return { ok: true as const };
  const apiKey = process.env.CLIENT_CMS_RESEND_API_KEY;
  const from = process.env.CLIENT_CMS_EMAIL_FROM;
  const siteUrl = process.env.CLIENT_CMS_SITE_URL;
  if (!apiKey || !from || !siteUrl) return { ok: true as const };

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await getClientCmsPool().query(
    `DELETE FROM lf_cms_password_resets WHERE project_id = $1 AND user_id = $2`,
    [projectId, user.rows[0].id],
  );
  await getClientCmsPool().query(
    `INSERT INTO lf_cms_password_resets(project_id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + interval '30 minutes')`,
    [projectId, user.rows[0].id, tokenHash],
  );
  const resetUrl = new URL("/cms/reset-password", siteUrl);
  resetUrl.searchParams.set("token", token);
  const safeUrl = resetUrl.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [user.rows[0].email],
      subject: "Redefinição da palavra-passe",
      html: `<p>Recebemos um pedido para redefinir a palavra-passe do CMS.</p><p><a href="${safeUrl}">Criar nova palavra-passe</a></p><p>O link expira em 30 minutos. Se não pediu esta alteração, ignore esta mensagem.</p>`,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => undefined);
  return { ok: true as const };
}

export async function resetClientCmsPassword(rawToken: string, rawPassword: string) {
  const token = z.string().regex(/^[a-f0-9]{64}$/).safeParse(rawToken);
  const password = passwordSchema.safeParse(rawPassword);
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  if (!token.success || !password.success || !projectId) return false;
  const passwordHash = await hash(password.data, { type: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const tokenHash = createHash("sha256").update(token.data).digest("hex");
  return withClientCmsTransaction(async (client) => {
    const reset = await client.query(
      `SELECT id, user_id FROM lf_cms_password_resets
        WHERE project_id = $1 AND token_hash = $2 AND used_at IS NULL AND expires_at > now()
        FOR UPDATE`,
      [projectId, tokenHash],
    );
    if (!reset.rows[0]) return false;
    const claimed = await client.query(
      `UPDATE lf_cms_password_resets SET used_at = now()
        WHERE project_id = $1 AND id = $2 AND used_at IS NULL RETURNING id`,
      [projectId, reset.rows[0].id],
    );
    if (!claimed.rows[0]) return false;
    await client.query(
      `UPDATE lf_cms_users SET password_hash = $3, authorization_version = authorization_version + 1, updated_at = now()
        WHERE project_id = $1 AND id = $2`,
      [projectId, reset.rows[0].user_id, passwordHash],
    );
    return true;
  });
}
