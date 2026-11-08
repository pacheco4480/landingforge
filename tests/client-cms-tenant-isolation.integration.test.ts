import { createHash, createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { verify } from "argon2";

vi.mock("server-only", () => ({}));
vi.mock("@/features/exports/client-runtime/cms/auth", () => ({ auth: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
const { storageRemove, storageUpload } = vi.hoisted(() => ({
  storageRemove: vi.fn(async () => ({ error: null })),
  storageUpload: vi.fn(async () => ({ error: null })),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        remove: storageRemove,
        upload: storageUpload,
        getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://storage.invalid/${path}` } })),
      })),
    },
  })),
}));

import { auth } from "@/features/exports/client-runtime/cms/auth";
import {
  getClientCmsDashboard,
  getClientCmsForms,
  getClientCmsPage,
  listClientCmsLeads,
  exportClientCmsLeadsCsv,
  deleteClientCmsLeadData,
  setClientCmsFormActive,
  setClientCmsPageStatus,
  updateClientCmsLeadStatus,
  updateClientCmsSection,
} from "@/features/exports/client-runtime/cms/content.service";
import type { AuthorizedClientCmsContext } from "@/features/exports/client-runtime/cms/contracts";
import {
  clientCmsSetFormActive,
  clientCmsSetLeadStatus,
  clientCmsDeleteLead,
  clientCmsSetPageStatus,
  clientCmsUpdateSection,
} from "@/features/exports/client-runtime/cms/actions";
import { submitClientCmsLead } from "@/features/exports/client-runtime/cms/form-submission.service";
import { getClientCmsPreviewPayload, getPublishedClientCmsPayload } from "@/features/exports/client-runtime/cms/public-page.service";
import { closeClientCmsPool } from "@/features/exports/client-runtime/cms/database";
import { requireClientCmsActor } from "@/features/exports/client-runtime/cms/authorization";
import { deleteClientCmsMedia, listClientCmsMedia, uploadClientCmsMedia } from "@/features/exports/client-runtime/cms/media.service";
import { requestClientCmsPasswordReset, resetClientCmsPassword } from "@/features/exports/client-runtime/cms/password-reset.service";

const testDatabaseUrl = process.env.CLIENT_CMS_TEST_DATABASE_URL;
const integration = describe.skipIf(!testDatabaseUrl);

integration("client CMS tenant isolation against PostgreSQL", () => {
  const schema = `cms_test_${randomUUID().replaceAll("-", "")}`;
  let adminPool: Pool;
  let tenantPool: Pool;
  let projectA: string;
  let projectB: string;
  let pageA: string;
  let pageB: string;
  let sectionA: string;
  let sectionB: string;
  let hiddenSectionA: string;
  let formA: string;
  let formB: string;
  let leadA: string;
  let leadB: string;
  let mediaA: string;
  let mediaB: string;
  let userA: string;
  let actorA: AuthorizedClientCmsContext;

  function setSession(projectId: string, userId: string, role: "client_admin" | "viewer" = "client_admin") {
    (auth as unknown as { mockResolvedValue: (value: unknown) => void }).mockResolvedValue({
      user: { id: userId },
      clientCms: { projectId, role, authorizationVersion: 1 },
    });
  }

  beforeAll(async () => {
    if (!testDatabaseUrl) return;
    if (process.env.DATABASE_URL && testDatabaseUrl === process.env.DATABASE_URL) {
      throw new Error("CLIENT_CMS_TEST_DATABASE_URL tem de ser diferente da base de dados Master.");
    }
    adminPool = new Pool({ connectionString: testDatabaseUrl, max: 1 });
    await adminPool.query(`CREATE SCHEMA ${schema}`);
    tenantPool = new Pool({ connectionString: testDatabaseUrl, max: 1, options: `-c search_path=${schema}` });
    const firstMigration = await readFile(join(process.cwd(), "prisma/client-runtime/migrations/0001_client_cms_foundation.sql"), "utf8");
    const secondMigration = await readFile(join(process.cwd(), "prisma/client-runtime/migrations/0002_content_revision.sql"), "utf8");
    await tenantPool.query(firstMigration);

    const runtimeUrl = new URL(testDatabaseUrl);
    runtimeUrl.searchParams.set("options", `-c search_path=${schema}`);
    process.env.CLIENT_CMS_DATABASE_URL = runtimeUrl.toString();
    process.env.CLIENT_CMS_PROJECT_ID = projectA = randomUUID();
    process.env.CLIENT_CMS_TEMPLATE_VERSION = "clinic/modern@1.0.0";
    process.env.CLIENT_CMS_SUPABASE_URL = "https://storage.invalid";
    process.env.CLIENT_CMS_SUPABASE_SERVICE_ROLE_KEY = "test-only";
    process.env.CLIENT_CMS_PUBLIC_MEDIA_BUCKET = "test-only";
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;

    projectB = randomUUID();
    for (const projectId of [projectA, projectB]) {
      await tenantPool.query(
        `INSERT INTO lf_cms_installations(project_id, template_key, variant_key, template_version, source_checksum, capabilities)
         VALUES ($1, 'clinic', 'modern', 'clinic/modern@1.0.0', $2, $3::jsonb)`,
        [projectId, "a".repeat(64), JSON.stringify([
          { sectionKey: "hero", sectionType: "hero", editableFields: ["title"] },
          { sectionKey: "services", sectionType: "services", editableFields: ["title", "text"] },
        ])],
      );
    }
    const themeA = {
      primaryColor: "#123456", secondaryColor: "#234567", accentColor: "#345678", backgroundColor: "#ffffff",
      surfaceColor: "#f5f5f5", textPrimaryColor: "#111111", textSecondaryColor: "#444444",
      headingFont: "Inter", bodyFont: "Inter", borderRadius: "8px",
    };
    const themeB = { ...themeA, primaryColor: "#abcdef" };
    const insertedA = await tenantPool.query(
      `INSERT INTO lf_cms_pages(project_id, slug, title, status, theme, seo)
       VALUES ($1, 'a', 'Cliente A', 'published', $2::jsonb, '{"title":"SEO A"}') RETURNING id`,
      [projectA, JSON.stringify(themeA)],
    );
    const insertedB = await tenantPool.query(
      `INSERT INTO lf_cms_pages(project_id, slug, title, status, theme, seo)
       VALUES ($1, 'b', 'Cliente B', 'published', $2::jsonb, '{"title":"SEO B"}') RETURNING id`,
      [projectB, JSON.stringify(themeB)],
    );
    pageA = insertedA.rows[0].id;
    pageB = insertedB.rows[0].id;
    const insertedSectionA = await tenantPool.query(
      `INSERT INTO lf_cms_sections(project_id, page_id, section_key, section_type, name, content, settings)
       VALUES ($1, $2, 'hero', 'hero', 'Hero', '{"title":"A original"}', '{"layout":"a"}') RETURNING id`, [projectA, pageA],
    );
    const insertedSectionB = await tenantPool.query(
      `INSERT INTO lf_cms_sections(project_id, page_id, section_key, section_type, name, content, settings)
       VALUES ($1, $2, 'hero', 'hero', 'Hero', '{"title":"B original"}', '{"layout":"b"}') RETURNING id`, [projectB, pageB],
    );
    const insertedHiddenSectionA = await tenantPool.query(
      `INSERT INTO lf_cms_sections(project_id, page_id, section_key, section_type, name, content, is_visible)
       VALUES ($1, $2, 'services', 'services', 'Services', '{"title":"Generic services"}', false) RETURNING id`, [projectA, pageA],
    );
    sectionA = insertedSectionA.rows[0].id;
    sectionB = insertedSectionB.rows[0].id;
    hiddenSectionA = insertedHiddenSectionA.rows[0].id;
    actorA = {
      userId: randomUUID(), projectId: projectA, role: "client_admin", authorizationVersion: 1,
      installation: {
        projectId: projectA, templateKey: "clinic", variantKey: "modern", templateVersion: "clinic/modern@1.0.0",
        sourceChecksum: "a".repeat(64), capabilities: [
          { sectionKey: "hero", sectionType: "hero", editableFields: ["title"] },
          { sectionKey: "services", sectionType: "services", editableFields: ["title", "text"] },
        ],
      },
    };

    const insertedFormA = await tenantPool.query(
      `INSERT INTO lf_cms_forms(project_id, page_id, form_key, name, is_active, consent_required)
       VALUES ($1, $2, 'contact-a', 'Contacto A', true, false) RETURNING id`, [projectA, pageA],
    );
    const insertedFormB = await tenantPool.query(
      `INSERT INTO lf_cms_forms(project_id, page_id, form_key, name, is_active, consent_required)
       VALUES ($1, $2, 'private-b', 'Contacto B', true, false) RETURNING id`, [projectB, pageB],
    );
    formA = insertedFormA.rows[0].id;
    formB = insertedFormB.rows[0].id;
    for (const [projectId, formId] of [[projectA, formA], [projectB, formB]]) {
      await tenantPool.query(
        `INSERT INTO lf_cms_form_fields(project_id, form_id, field_name, label, field_type, is_required)
         VALUES ($1, $2, 'email', 'Email', 'email', true)`, [projectId, formId],
      );
    }
    const submission = await tenantPool.query(
      `INSERT INTO lf_cms_submissions(project_id, form_id, page_id, data)
       VALUES ($1, $2, $3, '{"email":"a@example.test"}') RETURNING id`, [projectA, formA, pageA],
    );
    const insertedLeadA = await tenantPool.query(
      `INSERT INTO lf_cms_leads(project_id, submission_id, email)
       VALUES ($1, $2, 'a@example.test') RETURNING id`, [projectA, submission.rows[0].id],
    );
    leadA = insertedLeadA.rows[0].id;
    const submissionB = await tenantPool.query(
      `INSERT INTO lf_cms_submissions(project_id, form_id, page_id, data)
       VALUES ($1, $2, $3, '{"email":"b@example.test"}') RETURNING id`, [projectB, formB, pageB],
    );
    const insertedLeadB = await tenantPool.query(
      `INSERT INTO lf_cms_leads(project_id, submission_id, email)
       VALUES ($1, $2, 'b@example.test') RETURNING id`, [projectB, submissionB.rows[0].id],
    );
    leadB = insertedLeadB.rows[0].id;
    const insertedUserA = await tenantPool.query(
      `INSERT INTO lf_cms_users(project_id, name, email, password_hash, role)
       VALUES ($1, 'QA A', 'qa-a@example.invalid', 'unused-test-hash', 'client_admin') RETURNING id`, [projectA],
    );
    userA = insertedUserA.rows[0].id;
    actorA.userId = userA;
    setSession(projectA, userA);
    const insertedMediaA = await tenantPool.query(
      `INSERT INTO lf_cms_media(project_id, object_path, filename, mime_type, size_bytes, alt_text)
       VALUES ($1, $2, 'a.png', 'image/png', 8, 'Imagem A') RETURNING id`, [projectA, `${projectA}/a.png`],
    );
    const insertedMediaB = await tenantPool.query(
      `INSERT INTO lf_cms_media(project_id, object_path, filename, mime_type, size_bytes, alt_text)
       VALUES ($1, $2, 'b.png', 'image/png', 8, 'Imagem B') RETURNING id`, [projectB, `${projectB}/b.png`],
    );
    mediaA = insertedMediaA.rows[0].id;
    mediaB = insertedMediaB.rows[0].id;
    await tenantPool.query(secondMigration);
  }, 30000);

  afterAll(async () => {
    await closeClientCmsPool();
    await tenantPool?.end();
    if (adminPool) {
      await adminPool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await adminPool.end();
    }
  });

  it("lists only the signed-in Project and refuses another Project's section ID", async () => {
    const page = await getClientCmsPage(actorA, tenantPool);
    expect(page?.title).toBe("Cliente A");
    expect(page?.sections).toHaveLength(1);
    expect(page?.sections[0].content).toEqual({ title: "A original" });
    expect(page?.capabilities.map((capability: { sectionKey: string }) => capability.sectionKey)).toEqual(["hero"]);
    await expect(updateClientCmsSection(actorA, {
      pageId: pageB,
      sectionId: sectionB,
      content: { title: "Tentativa de alteração" },
    }, async (operation) => {
      const client = await tenantPool.connect();
      try {
        await client.query("BEGIN");
        const result = await operation(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    })).rejects.toThrow("Secção não encontrada neste Project.");
    await expect(updateClientCmsSection(actorA, {
      pageId: pageA,
      sectionId: hiddenSectionA,
      content: { title: "Tentativa na secção oculta" },
    }, async (operation) => {
      const client = await tenantPool.connect();
      try {
        await client.query("BEGIN");
        const result = await operation(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    })).rejects.toThrow("Secção não encontrada neste Project.");
    const unchanged = await tenantPool.query("SELECT content FROM lf_cms_sections WHERE project_id = $1 AND id = $2", [projectB, sectionB]);
    expect(unchanged.rows[0].content).toEqual({ title: "B original" });
  });

  it("applies upgrades without losing existing section content or leads", async () => {
    const section = await tenantPool.query("SELECT content FROM lf_cms_sections WHERE project_id = $1 AND id = $2", [projectA, sectionA]);
    expect(section.rows[0].content).toEqual({ title: "A original" });
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1", [projectA])).rows[0].count).toBe(1);
    expect((await tenantPool.query("SELECT content_revision FROM lf_cms_pages WHERE project_id = $1 AND id = $2", [projectA, pageA])).rows[0].content_revision).toBe(1);
  });

  it("scopes page, dashboard, settings and pinned capabilities to the actor Project", async () => {
    const page = await getClientCmsPage(actorA, tenantPool);
    expect(page?.title).toBe("Cliente A");
    expect(page?.theme.primaryColor).toBe("#123456");
    expect(page?.seo).toEqual({ title: "SEO A" });
    expect(page?.sections[0].settings).toEqual({ layout: "a" });
    expect(await getClientCmsDashboard(actorA, tenantPool)).toMatchObject({ pages: 1, forms: 1, new_leads: 1, sections: 1 });
    await expect(getClientCmsPage({ ...actorA, installation: { ...actorA.installation, projectId: projectB } }, tenantPool))
      .rejects.toThrow("O contexto da instalação não corresponde ao Project autorizado.");
    await expect(updateClientCmsSection(actorA, {
      pageId: pageA, sectionId: sectionA, content: { settings: { primaryColor: "#000000" } },
    }, async (operation) => {
      const client = await tenantPool.connect();
      try { await client.query("BEGIN"); const result = await operation(client); await client.query("COMMIT"); return result; }
      catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    })).rejects.toThrow("Um ou mais campos não são editáveis nesta versão do template.");
    const themeB = await tenantPool.query("SELECT theme, seo FROM lf_cms_pages WHERE project_id = $1 AND id = $2", [projectB, pageB]);
    expect(themeB.rows[0].theme.primaryColor).toBe("#abcdef");
    expect(themeB.rows[0].seo).toEqual({ title: "SEO B" });
    expect((await getClientCmsPreviewPayload(actorA))?.page.title).toBe("Cliente A");
    expect((await getPublishedClientCmsPayload())?.page.title).toBe("Cliente A");
    await expect(getClientCmsPreviewPayload({ ...actorA, installation: { ...actorA.installation, projectId: projectB } }))
      .rejects.toThrow("O contexto da instalação não corresponde ao Project autorizado.");
  });

  it("denies cross-Project page, form and lead writes and isolates their reads", async () => {
    expect((await getClientCmsForms(actorA, tenantPool)).map((form) => form.id)).toEqual([formA]);
    expect((await listClientCmsLeads(actorA, tenantPool)).map((lead) => lead.id)).toEqual([leadA]);
    await expect(setClientCmsPageStatus(actorA, pageB, "draft", tenantPool)).rejects.toThrow("Página não encontrada neste Project.");
    await expect(setClientCmsFormActive(actorA, formB, false, tenantPool)).rejects.toThrow("Formulário não encontrado neste Project.");
    await expect(updateClientCmsLeadStatus(actorA, leadB, "converted", tenantPool)).rejects.toThrow("Lead não encontrado neste Project.");
    await expect(clientCmsUpdateSection({ pageId: pageB, sectionId: sectionB, content: { title: "Cross-tenant" } }))
      .rejects.toThrow("Secção não encontrada neste Project.");
    await expect(clientCmsSetPageStatus({ pageId: pageB, status: "draft" })).rejects.toThrow("Página não encontrada neste Project.");
    await expect(clientCmsSetFormActive({ formId: formB, isActive: false })).rejects.toThrow("Formulário não encontrado neste Project.");
    await expect(clientCmsSetLeadStatus({ leadId: leadB, status: "converted" })).rejects.toThrow("Lead não encontrado neste Project.");
    expect((await tenantPool.query("SELECT status FROM lf_cms_pages WHERE project_id = $1 AND id = $2", [projectB, pageB])).rows[0].status).toBe("published");
    expect((await tenantPool.query("SELECT is_active FROM lf_cms_forms WHERE project_id = $1 AND id = $2", [projectB, formB])).rows[0].is_active).toBe(true);
    expect((await tenantPool.query("SELECT status FROM lf_cms_leads WHERE project_id = $1 AND id = $2", [projectB, leadB])).rows[0].status).toBe("new");
  });

  it("keeps public form submissions and resulting leads inside the configured tenant", async () => {
    process.env.CLIENT_CMS_PROJECT_ID = projectA;
    await expect(submitClientCmsLead({
      formKey: "private-b", values: { email: "intrusion@example.invalid" }, consentGiven: false,
    })).rejects.toThrow("Este formulário não está disponível.");
    expect(await submitClientCmsLead({
      formKey: "contact-a", values: { email: "synthetic@example.invalid" }, consentGiven: false,
    })).toEqual({ ok: true });
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_submissions WHERE project_id = $1", [projectA])).rows[0].count).toBe(2);
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1", [projectA])).rows[0].count).toBe(2);
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_submissions WHERE project_id = $1", [projectB])).rows[0].count).toBe(1);
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1", [projectB])).rows[0].count).toBe(1);
  });

  it("scopes media reads and denies cross-Project deletion before touching storage", async () => {
    const media = await listClientCmsMedia();
    expect(media.map((item) => item.id)).toEqual([mediaA]);
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const uploaded = await uploadClientCmsMedia(new File([png], "qa.png", { type: "image/png" }), "Imagem sintética");
    expect(String(uploaded.object_path)).toMatch(new RegExp(`^${projectA}/`));
    expect(storageUpload).toHaveBeenCalledTimes(1);
    await expect(deleteClientCmsMedia(mediaB)).rejects.toThrow("Ficheiro não encontrado nesta instalação.");
    expect(storageRemove).not.toHaveBeenCalled();
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_media WHERE project_id = $1 AND id = $2", [projectB, mediaB])).rows[0].count).toBe(1);
    await deleteClientCmsMedia(mediaA);
    expect(storageRemove).toHaveBeenCalledTimes(1);
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_media WHERE project_id = $1 AND id = $2", [projectA, mediaA])).rows[0].count).toBe(0);
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_media WHERE project_id = $1 AND id = $2", [projectB, mediaB])).rows[0].count).toBe(1);
  });

  it("rejects tenant switching and read-only roles at the authorization boundary", async () => {
    setSession(projectB, userA);
    await expect(requireClientCmsActor("content.read")).rejects.toThrow("Sessão CMS inválida ou sem acesso a esta instalação.");
    setSession(projectA, userA, "viewer");
    await expect(requireClientCmsActor("content.write")).rejects.toThrow("Não tem permissão para executar esta operação.");
    expect((await requireClientCmsActor("content.read")).projectId).toBe(projectA);
  });

  it("exports all and only the authorized Project's lead/submission data with spreadsheet formula protection", async () => {
    const submission = await tenantPool.query(
      `INSERT INTO lf_cms_submissions(project_id, form_id, page_id, data)
       VALUES ($1, $2, $3, $4::jsonb) RETURNING id`,
      [projectA, formA, pageA, JSON.stringify({ custom: "=HYPERLINK(\"https://bad.invalid\")", notes: "synthetic" })],
    );
    await tenantPool.query(
      `INSERT INTO lf_cms_leads(project_id, submission_id, name, email, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      [projectA, submission.rows[0].id, "=2+2", " +cmd|/C calc", "\t@SUM(A1:A2)"],
    );

    const csv = await exportClientCmsLeadsCsv(actorA);
    expect(csv.startsWith("\uFEFF\"ID\"" )).toBe(true);
    expect(csv).toContain("'=2+2");
    expect(csv).toContain("' +cmd|/C calc");
    expect(csv).toContain("'\t@SUM(A1:A2)");
    expect(csv).toContain("=HYPERLINK");
    expect(csv).toContain("a@example.test");
    expect(csv).not.toContain("b@example.test");
    const audit = await tenantPool.query(
      `SELECT action, resource_type, resource_id FROM lf_cms_audit_events
        WHERE project_id = $1 AND action = 'lead.export'`, [projectA],
    );
    expect(audit.rows).toEqual([{ action: "lead.export", resource_type: "lead_collection", resource_id: null }]);
    expect(JSON.stringify(audit.rows)).not.toContain("a@example.test");

    setSession(projectA, userA, "viewer");
    await expect(requireClientCmsActor("leads.export")).rejects.toThrow("Não tem permissão para executar esta operação.");
    setSession(projectA, userA);
  });

  it("requires explicit deletion confirmation, prevents cross-Project deletion, and removes lead plus full submission", async () => {
    await expect(clientCmsDeleteLead({ leadId: leadA, confirmed: false })).rejects.toThrow();
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1 AND id = $2", [projectA, leadA])).rows[0].count).toBe(1);
    await expect(clientCmsDeleteLead({ leadId: leadB, confirmed: true })).rejects.toThrow("Lead não encontrado neste Project.");
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1 AND id = $2", [projectB, leadB])).rows[0].count).toBe(1);

    setSession(projectA, userA, "viewer");
    await expect(clientCmsDeleteLead({ leadId: leadA, confirmed: true })).rejects.toThrow("Não tem permissão para executar esta operação.");
    setSession(projectA, userA);

    const created = await tenantPool.query(
      `INSERT INTO lf_cms_submissions(project_id, form_id, page_id, data)
       VALUES ($1, $2, $3, '{"email":"erase-me@example.invalid","message":"private synthetic value"}') RETURNING id`,
      [projectA, formA, pageA],
    );
    const lead = await tenantPool.query(
      `INSERT INTO lf_cms_leads(project_id, submission_id, email, message)
       VALUES ($1, $2, 'erase-me@example.invalid', 'private synthetic value') RETURNING id`,
      [projectA, created.rows[0].id],
    );
    await expect(deleteClientCmsLeadData(actorA, lead.rows[0].id, false)).rejects.toThrow("Confirma explicitamente");
    await expect(deleteClientCmsLeadData(actorA, lead.rows[0].id, "yes")).rejects.toThrow("Confirma explicitamente");
    expect(await deleteClientCmsLeadData(actorA, lead.rows[0].id, true)).toEqual({ deleted: true });
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1 AND id = $2", [projectA, lead.rows[0].id])).rows[0].count).toBe(0);
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_submissions WHERE project_id = $1 AND id = $2", [projectA, created.rows[0].id])).rows[0].count).toBe(0);
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1 AND id = $2", [projectB, leadB])).rows[0].count).toBe(1);
    const audit = await tenantPool.query(
      `SELECT project_id, actor_user_id, action, resource_type, resource_id FROM lf_cms_audit_events
        WHERE project_id = $1 AND action = 'lead.data.delete' AND resource_id = $2`, [projectA, lead.rows[0].id],
    );
    expect(audit.rows).toEqual([{
      project_id: projectA, actor_user_id: userA, action: "lead.data.delete", resource_type: "lead", resource_id: lead.rows[0].id,
    }]);
    expect(JSON.stringify(audit.rows)).not.toContain("erase-me@example.invalid");
  });

  it("rolls back lead and submission deletion if the audit write fails", async () => {
    const submission = await tenantPool.query(
      `INSERT INTO lf_cms_submissions(project_id, form_id, page_id, data)
       VALUES ($1, $2, $3, '{"email":"rollback@example.invalid"}') RETURNING id`, [projectA, formA, pageA],
    );
    const lead = await tenantPool.query(
      `INSERT INTO lf_cms_leads(project_id, submission_id, email)
       VALUES ($1, $2, 'rollback@example.invalid') RETURNING id`, [projectA, submission.rows[0].id],
    );
    await tenantPool.query(`CREATE FUNCTION fail_lead_delete_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action = 'lead.data.delete' THEN RAISE EXCEPTION 'forced audit failure'; END IF; RETURN NEW; END $$`);
    await tenantPool.query(`CREATE TRIGGER fail_lead_delete_audit BEFORE INSERT ON lf_cms_audit_events
      FOR EACH ROW EXECUTE FUNCTION fail_lead_delete_audit()`);
    try {
      await expect(deleteClientCmsLeadData(actorA, lead.rows[0].id, true)).rejects.toThrow("forced audit failure");
      expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1 AND id = $2", [projectA, lead.rows[0].id])).rows[0].count).toBe(1);
      expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_submissions WHERE project_id = $1 AND id = $2", [projectA, submission.rows[0].id])).rows[0].count).toBe(1);
    } finally {
      await tenantPool.query("DROP TRIGGER IF EXISTS fail_lead_delete_audit ON lf_cms_audit_events");
      await tenantPool.query("DROP FUNCTION IF EXISTS fail_lead_delete_audit()");
    }
  });

  it("simulates Resend and verifies generic reset responses, throttling, hashed single-use tokens and session revocation", async () => {
    const previousEnvironment = new Map([
      ["CLIENT_CMS_RATE_LIMIT_SECRET", process.env.CLIENT_CMS_RATE_LIMIT_SECRET],
      ["CLIENT_CMS_RESEND_API_KEY", process.env.CLIENT_CMS_RESEND_API_KEY],
      ["CLIENT_CMS_EMAIL_FROM", process.env.CLIENT_CMS_EMAIL_FROM],
      ["CLIENT_CMS_SITE_URL", process.env.CLIENT_CMS_SITE_URL],
    ]);
    process.env.CLIENT_CMS_RATE_LIMIT_SECRET = "disposable-reset-test-secret";
    process.env.CLIENT_CMS_RESEND_API_KEY = "resend-test-key-never-sent";
    process.env.CLIENT_CMS_EMAIL_FROM = "no-reply@example.invalid";
    process.env.CLIENT_CMS_SITE_URL = "https://cms.example.invalid";
    const sentRequests: Array<{ url: string; init?: RequestInit }> = [];
    const simulatedResend = vi.fn(async (...args: Parameters<typeof fetch>) => {
      sentRequests.push({ url: String(args[0]), init: args[1] });
      return new Response(null, { status: 202 });
    });
    vi.stubGlobal("fetch", simulatedResend);

    try {
      await tenantPool.query("DELETE FROM lf_cms_auth_limits WHERE project_id = $1", [projectA]);
      const auditBefore = Number((await tenantPool.query(
        "SELECT count(*)::int AS count FROM lf_cms_audit_events WHERE project_id = $1", [projectA],
      )).rows[0].count);

      const existingResponse = await requestClientCmsPasswordReset("qa-a@example.invalid");
      const missingResponse = await requestClientCmsPasswordReset("missing@example.invalid");
      expect(existingResponse).toEqual({ ok: true });
      expect(missingResponse).toEqual(existingResponse);
      expect(sentRequests).toHaveLength(1);
      expect(sentRequests[0].url).toBe("https://api.resend.com/emails");
      expect(sentRequests[0].init?.method).toBe("POST");
      expect(sentRequests[0].init?.headers).toMatchObject({ authorization: "Bearer resend-test-key-never-sent" });

      for (let attempt = 0; attempt < 4; attempt += 1) {
        expect(await requestClientCmsPasswordReset("qa-a@example.invalid")).toEqual({ ok: true });
      }
      expect(sentRequests).toHaveLength(5);
      expect(await requestClientCmsPasswordReset("qa-a@example.invalid")).toEqual({ ok: true });
      expect(sentRequests).toHaveLength(5);

      const rateKey = createHmac("sha256", "disposable-reset-test-secret")
        .update("reset:qa-a@example.invalid").digest("hex");
      const rate = await tenantPool.query(
        "SELECT request_count FROM lf_cms_auth_limits WHERE project_id = $1 AND key_hash = $2", [projectA, rateKey],
      );
      expect(Number(rate.rows[0]?.request_count)).toBe(6);

      const lastEmail = JSON.parse(String(sentRequests[4].init?.body)) as { to: string[]; html: string };
      expect(lastEmail.to).toEqual(["qa-a@example.invalid"]);
      const resetLink = lastEmail.html.match(/href="([^"]+)"/)?.[1];
      expect(resetLink).toBeTruthy();
      const rawToken = new URL(resetLink!).searchParams.get("token");
      expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
      const userReset = await tenantPool.query(
        `SELECT id, token_hash, expires_at, used_at FROM lf_cms_password_resets
          WHERE project_id = $1 AND user_id = $2`, [projectA, userA],
      );
      expect(userReset.rows).toHaveLength(1);
      expect(userReset.rows[0].token_hash).toBe(createHash("sha256").update(rawToken!).digest("hex"));
      expect(userReset.rows[0].token_hash).not.toBe(rawToken);
      const expiresAt = new Date(userReset.rows[0].expires_at).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now() + 29 * 60 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000 + 5000);
      expect(userReset.rows[0].used_at).toBeNull();
      expect(Number((await tenantPool.query(
        "SELECT count(*)::int AS count FROM lf_cms_audit_events WHERE project_id = $1", [projectA],
      )).rows[0].count)).toBe(auditBefore);

      const userBResult = await tenantPool.query(
        `INSERT INTO lf_cms_users(project_id, name, email, password_hash, role)
         VALUES ($1, 'QA B', 'qa-b@example.invalid', 'b-hash-unchanged', 'client_admin') RETURNING id`, [projectB],
      );
      const userBId = userBResult.rows[0].id;
      const bBefore = await tenantPool.query(
        "SELECT password_hash, authorization_version FROM lf_cms_users WHERE project_id = $1 AND id = $2", [projectB, userBId],
      );
      const aBefore = await tenantPool.query(
        "SELECT authorization_version FROM lf_cms_users WHERE project_id = $1 AND id = $2", [projectA, userA],
      );
      setSession(projectA, userA);
      const newPassword = "NewSyntheticPassphrase-42!";
      expect(await resetClientCmsPassword(rawToken!, newPassword)).toBe(true);
      expect(await resetClientCmsPassword(rawToken!, "AnotherSyntheticPassphrase-43!")).toBe(false);
      const aAfter = await tenantPool.query(
        "SELECT password_hash, authorization_version FROM lf_cms_users WHERE project_id = $1 AND id = $2", [projectA, userA],
      );
      expect(await verify(aAfter.rows[0].password_hash, newPassword)).toBe(true);
      expect(Number(aAfter.rows[0].authorization_version)).toBe(Number(aBefore.rows[0].authorization_version) + 1);
      expect((await tenantPool.query(
        "SELECT password_hash, authorization_version FROM lf_cms_users WHERE project_id = $1 AND id = $2", [projectB, userBId],
      )).rows[0]).toEqual(bBefore.rows[0]);
      await expect(requireClientCmsActor("content.read")).rejects.toThrow("A sessão foi revogada. Inicia sessão novamente.");
      const expiredUser = await tenantPool.query(
        `INSERT INTO lf_cms_users(project_id, name, email, password_hash, role)
         VALUES ($1, 'QA reset expired', 'expired-reset@example.invalid', 'initial-hash', 'client_admin') RETURNING id`, [projectA],
      );
      expect(await requestClientCmsPasswordReset("expired-reset@example.invalid")).toEqual({ ok: true });
      const expiredEmail = JSON.parse(String(sentRequests[5].init?.body)) as { html: string };
      const expiredToken = new URL(expiredEmail.html.match(/href="([^"]+)"/)![1]).searchParams.get("token")!;
      await tenantPool.query(
        `UPDATE lf_cms_password_resets SET expires_at = now() - interval '1 minute'
          WHERE project_id = $1 AND user_id = $2`, [projectA, expiredUser.rows[0].id],
      );
      expect(await resetClientCmsPassword(expiredToken, "ExpiredSyntheticPassword-44!")).toBe(false);
      const expiredState = await tenantPool.query(
        `SELECT u.password_hash, u.authorization_version, r.token_hash, r.used_at
           FROM lf_cms_users u JOIN lf_cms_password_resets r
             ON r.project_id = u.project_id AND r.user_id = u.id
          WHERE u.project_id = $1 AND u.id = $2`, [projectA, expiredUser.rows[0].id],
      );
      expect(expiredState.rows[0].password_hash).toBe("initial-hash");
      expect(Number(expiredState.rows[0].authorization_version)).toBe(1);
      expect(expiredState.rows[0].token_hash).toBe(createHash("sha256").update(expiredToken).digest("hex"));
      expect(expiredState.rows[0].used_at).toBeNull();

      const audits = await tenantPool.query(
        "SELECT actor_user_id, action, resource_type, resource_id FROM lf_cms_audit_events WHERE project_id = $1", [projectA],
      );
      expect(JSON.stringify(audits.rows)).not.toContain("qa-a@example.invalid");
      expect(JSON.stringify(audits.rows)).not.toContain(rawToken);
      expect(JSON.stringify(audits.rows)).not.toContain(expiredToken);
    } finally {
      vi.unstubAllGlobals();
      for (const [key, value] of previousEnvironment) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
