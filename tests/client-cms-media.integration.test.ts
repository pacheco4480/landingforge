import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool, type PoolClient } from "pg";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ pool: null as unknown, actor: null as unknown }));

vi.mock("server-only", () => ({}));
vi.mock("@/features/exports/client-runtime/cms/authorization", () => ({
  requireClientCmsActor: async () => {
    if (!state.actor) throw new Error("Sem sessão de teste.");
    return state.actor;
  },
  getActorInstallation: (actor: { installation: unknown }) => actor.installation,
}));
vi.mock("@/features/exports/client-runtime/cms/database", () => ({
  getClientCmsPool: () => state.pool,
  withClientCmsTransaction: async (operation: (client: PoolClient) => Promise<unknown>) => {
    const client = await (state.pool as Pool).connect();
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
  },
}));

import {
  deleteClientCmsMedia,
  listClientCmsMedia,
  uploadClientCmsMedia,
} from "@/features/exports/client-runtime/cms/media.service";

const testDatabaseUrl = process.env.CLIENT_CMS_TEST_DATABASE_URL;
const testProjectId = process.env.CLIENT_CMS_TEST_PROJECT_ID;
const integrationEnabled =
  process.env.RUN_CLIENT_CMS_MEDIA_INTEGRATION === "1" &&
  Boolean(testDatabaseUrl) &&
  Boolean(testProjectId) &&
  process.env.CLIENT_CMS_MEDIA_TEST_CONFIRMATION === testProjectId &&
  process.env.CLIENT_CMS_TEST_SUPABASE_URL?.startsWith("https://") === true &&
  Boolean(process.env.CLIENT_CMS_TEST_SUPABASE_SECRET_KEY) &&
  Boolean(process.env.CLIENT_CMS_TEST_BUCKET);

const integration = describe.skipIf(!integrationEnabled);

integration("client CMS media service with isolated Supabase test resources", () => {
  const schema = `media_test_${randomUUID().replaceAll("-", "")}`;
  const projectA = randomUUID();
  const projectB = randomUUID();
  let adminPool: Pool;
  let tenantPool: Pool;
  let pageA: string;
  let sectionA: string;
  let objectPath: string | undefined;
  const actorA = {
    userId: randomUUID(),
    projectId: projectA,
    role: "client_admin" as const,
    authorizationVersion: 1,
    installation: {
      projectId: projectA,
      templateKey: "restaurant",
      variantKey: "playful",
      templateVersion: "restaurant/playful@test",
      sourceChecksum: "a".repeat(64),
      capabilities: [],
    },
  };

  beforeAll(async () => {
    if (!testDatabaseUrl || !testProjectId) throw new Error("Configuração de teste incompleta.");
    const url = new URL(testDatabaseUrl);
    if (
      url.hostname !== "aws-1-eu-west-3.pooler.supabase.com" ||
      url.username !== `postgres.${testProjectId}` ||
      decodeURIComponent(url.pathname.slice(1)) !== "postgres" ||
      process.env.DATABASE_URL === testDatabaseUrl
    ) {
      throw new Error("A integração exige a BD Supabase explicitamente identificada como teste; Master recusada.");
    }

    process.env.CLIENT_CMS_SUPABASE_URL = process.env.CLIENT_CMS_TEST_SUPABASE_URL;
    process.env.CLIENT_CMS_SUPABASE_SERVICE_ROLE_KEY = process.env.CLIENT_CMS_TEST_SUPABASE_SECRET_KEY;
    process.env.CLIENT_CMS_PUBLIC_MEDIA_BUCKET = process.env.CLIENT_CMS_TEST_BUCKET;

    adminPool = new Pool({ connectionString: testDatabaseUrl, max: 1, ssl: { rejectUnauthorized: false } });
    await adminPool.query(`CREATE SCHEMA ${schema}`);
    tenantPool = new Pool({
      connectionString: testDatabaseUrl,
      max: 1,
      options: `-c search_path=${schema}`,
      ssl: { rejectUnauthorized: false },
    });
    state.pool = tenantPool;

    for (const migration of ["0001_client_cms_foundation.sql", "0002_content_revision.sql"]) {
      const sql = await readFile(join(process.cwd(), "prisma/client-runtime/migrations", migration), "utf8");
      await tenantPool.query(sql);
    }

    for (const projectId of [projectA, projectB]) {
      await tenantPool.query(
        `INSERT INTO lf_cms_installations(project_id, template_key, variant_key, template_version, source_checksum, capabilities)
         VALUES ($1, 'restaurant', 'playful', 'restaurant/playful@test', $2, '[]'::jsonb)`,
        [projectId, "a".repeat(64)],
      );
    }
    const page = await tenantPool.query(
      "INSERT INTO lf_cms_pages(project_id, slug, title) VALUES ($1, 'teste', 'Página de teste') RETURNING id",
      [projectA],
    );
    pageA = page.rows[0].id;
    const section = await tenantPool.query(
      `INSERT INTO lf_cms_sections(project_id, page_id, section_key, section_type, name, content)
       VALUES ($1, $2, 'gallery', 'gallery', 'Galeria', '{}'::jsonb) RETURNING id`,
      [projectA, pageA],
    );
    sectionA = section.rows[0].id;
    state.actor = actorA;
  }, 30000);

  afterAll(async () => {
    if (objectPath && process.env.CLIENT_CMS_TEST_SUPABASE_URL && process.env.CLIENT_CMS_TEST_SUPABASE_SECRET_KEY && process.env.CLIENT_CMS_TEST_BUCKET) {
      const { createClient } = await import("@supabase/supabase-js");
      const storage = createClient(
        process.env.CLIENT_CMS_TEST_SUPABASE_URL,
        process.env.CLIENT_CMS_TEST_SUPABASE_SECRET_KEY,
        { auth: { persistSession: false } },
      ).storage.from(process.env.CLIENT_CMS_TEST_BUCKET);
      await storage.remove([objectPath]);
    }
    if (tenantPool) {
      await tenantPool.end();
      state.pool = null;
    }
    if (adminPool) {
      await adminPool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await adminPool.end();
    }
  });

  it("uploads, lists and serves media; enforces Project scope and referenced-media protection", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZL8AAAAASUVORK5CYII=",
      "base64",
    );
    const file = new File([png], "foto de teste.png", { type: "image/png" });
    const uploaded = await uploadClientCmsMedia(file, "Imagem de teste");
    const uploadedId = uploaded.id;
    objectPath = uploaded.object_path;

    expect(uploaded.object_path).toMatch(new RegExp(`^${projectA}/`));
    expect(uploaded.filename).toBe("foto-de-teste.png");
    expect((await listClientCmsMedia()).map((media) => media.id)).toContain(uploadedId);
    expect((await fetch(uploaded.publicUrl)).status).toBe(200);

    state.actor = { ...actorA, projectId: projectB, installation: { ...actorA.installation, projectId: projectB } };
    await expect(deleteClientCmsMedia(uploadedId)).rejects.toThrow("Ficheiro não encontrado nesta instalação.");
    expect((await fetch(uploaded.publicUrl)).status).toBe(200);

    state.actor = actorA;
    await tenantPool.query(
      "UPDATE lf_cms_sections SET content = $1::jsonb WHERE project_id = $2 AND id = $3",
      [JSON.stringify({ imageUrl: uploaded.publicUrl }), projectA, sectionA],
    );
    await expect(deleteClientCmsMedia(uploadedId)).rejects.toThrow("A imagem está a ser usada numa secção.");
    expect((await fetch(uploaded.publicUrl)).status).toBe(200);

    await tenantPool.query(
      "UPDATE lf_cms_sections SET content = '{}'::jsonb WHERE project_id = $1 AND id = $2",
      [projectA, sectionA],
    );
    await deleteClientCmsMedia(uploadedId);
    objectPath = undefined;
    expect(await listClientCmsMedia()).toHaveLength(0);
    const storage = createClient(
      process.env.CLIENT_CMS_TEST_SUPABASE_URL!,
      process.env.CLIENT_CMS_TEST_SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } },
    ).storage.from(process.env.CLIENT_CMS_TEST_BUCKET!);
    const remaining = await storage.list(projectA, { search: uploaded.object_path.split("/").at(-1) });
    expect(remaining.error).toBeNull();
    expect(remaining.data).toHaveLength(0);
  }, 30000);

  it("rejects unsupported MIME types and image-signature mismatches before storage writes", async () => {
    const plainText = new File(["not an image"], "nota.txt", { type: "text/plain" });
    await expect(uploadClientCmsMedia(plainText)).rejects.toThrow("imagem suportada até 10 MB");
    const mismatched = new File(["not a PNG"], "fake.png", { type: "image/png" });
    await expect(uploadClientCmsMedia(mismatched)).rejects.toThrow("não corresponde ao formato de imagem indicado");
    expect(await listClientCmsMedia()).toHaveLength(0);
  });
});
