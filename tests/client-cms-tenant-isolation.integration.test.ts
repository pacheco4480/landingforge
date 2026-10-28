import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/exports/client-runtime/cms/auth", () => ({ auth: vi.fn() }));

import { getClientCmsPage, updateClientCmsSection } from "@/features/exports/client-runtime/cms/content.service";
import type { AuthorizedClientCmsContext } from "@/features/exports/client-runtime/cms/contracts";

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
  let actorA: AuthorizedClientCmsContext;

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

    projectA = randomUUID();
    projectB = randomUUID();
    for (const projectId of [projectA, projectB]) {
      await tenantPool.query(
        `INSERT INTO lf_cms_installations(project_id, template_key, variant_key, template_version, source_checksum, capabilities)
         VALUES ($1, 'clinic', 'modern', 'clinic/modern@1.0.0', $2, $3::jsonb)`,
        [projectId, "a".repeat(64), JSON.stringify([{ sectionKey: "hero", sectionType: "hero", editableFields: ["title"] }])],
      );
    }
    const insertedA = await tenantPool.query(
      `INSERT INTO lf_cms_pages(project_id, slug, title) VALUES ($1, 'a', 'Cliente A') RETURNING id`, [projectA],
    );
    const insertedB = await tenantPool.query(
      `INSERT INTO lf_cms_pages(project_id, slug, title) VALUES ($1, 'b', 'Cliente B') RETURNING id`, [projectB],
    );
    pageA = insertedA.rows[0].id;
    pageB = insertedB.rows[0].id;
    const insertedSectionA = await tenantPool.query(
      `INSERT INTO lf_cms_sections(project_id, page_id, section_key, section_type, name, content)
       VALUES ($1, $2, 'hero', 'hero', 'Hero', '{"title":"A original"}') RETURNING id`, [projectA, pageA],
    );
    const insertedSectionB = await tenantPool.query(
      `INSERT INTO lf_cms_sections(project_id, page_id, section_key, section_type, name, content)
       VALUES ($1, $2, 'hero', 'hero', 'Hero', '{"title":"B original"}') RETURNING id`, [projectB, pageB],
    );
    sectionA = insertedSectionA.rows[0].id;
    sectionB = insertedSectionB.rows[0].id;
    actorA = {
      userId: randomUUID(), projectId: projectA, role: "client_admin", authorizationVersion: 1,
      installation: {
        projectId: projectA, templateKey: "clinic", variantKey: "modern", templateVersion: "clinic/modern@1.0.0",
        sourceChecksum: "a".repeat(64), capabilities: [{ sectionKey: "hero", sectionType: "hero", editableFields: ["title"] }],
      },
    };

    const form = await tenantPool.query(
      `INSERT INTO lf_cms_forms(project_id, page_id, form_key, name)
       VALUES ($1, $2, 'contact', 'Contacto') RETURNING id`, [projectA, pageA],
    );
    const submission = await tenantPool.query(
      `INSERT INTO lf_cms_submissions(project_id, form_id, page_id, data)
       VALUES ($1, $2, $3, '{"email":"a@example.test"}') RETURNING id`, [projectA, form.rows[0].id, pageA],
    );
    await tenantPool.query(
      `INSERT INTO lf_cms_leads(project_id, submission_id, email)
       VALUES ($1, $2, 'a@example.test')`, [projectA, submission.rows[0].id],
    );
    await tenantPool.query(secondMigration);
  }, 30000);

  afterAll(async () => {
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
    const unchanged = await tenantPool.query("SELECT content FROM lf_cms_sections WHERE project_id = $1 AND id = $2", [projectB, sectionB]);
    expect(unchanged.rows[0].content).toEqual({ title: "B original" });
  });

  it("applies upgrades without losing existing section content or leads", async () => {
    const section = await tenantPool.query("SELECT content FROM lf_cms_sections WHERE project_id = $1 AND id = $2", [projectA, sectionA]);
    expect(section.rows[0].content).toEqual({ title: "A original" });
    expect((await tenantPool.query("SELECT count(*)::int AS count FROM lf_cms_leads WHERE project_id = $1", [projectA])).rows[0].count).toBe(1);
    expect((await tenantPool.query("SELECT content_revision FROM lf_cms_pages WHERE project_id = $1 AND id = $2", [projectA, pageA])).rows[0].content_revision).toBe(1);
  });
});
