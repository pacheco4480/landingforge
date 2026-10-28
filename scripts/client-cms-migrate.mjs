import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const connectionString = process.env.CLIENT_CMS_DATABASE_URL?.trim();
if (!connectionString) throw new Error("Define CLIENT_CMS_DATABASE_URL para aplicar migrations da runtime cliente.");
const configuredUrl = new URL(connectionString);
if (!/^postgres(?:ql)?:$/.test(configuredUrl.protocol)) throw new Error("A runtime CMS requer PostgreSQL.");
if (process.env.NODE_ENV === "production" && configuredUrl.hostname === "localhost") {
  throw new Error("A runtime CMS não pode usar uma base de dados local em produção.");
}
if (process.env.NODE_ENV === "production" && configuredUrl.hostname !== "localhost" &&
    process.env.CLIENT_CMS_DATABASE_SSL !== "true" && configuredUrl.searchParams.get("sslmode") !== "require") {
  throw new Error("A ligação PostgreSQL da runtime CMS tem de exigir TLS em produção.");
}
if (process.env.DATABASE_URL && refersToSameDatabase(connectionString, process.env.DATABASE_URL.trim())) {
  throw new Error("A migration da runtime cliente não pode usar a base de dados Master.");
}

function refersToSameDatabase(first, second) {
  try {
    const a = new URL(first);
    const b = new URL(second);
    const protocol = (value) => value.replace(":", "").replace(/^postgresql$/, "postgres");
    return protocol(a.protocol) === protocol(b.protocol) && a.hostname.toLowerCase() === b.hostname.toLowerCase() &&
      (a.port || "5432") === (b.port || "5432") && decodeURIComponent(a.pathname) === decodeURIComponent(b.pathname);
  } catch {
    return first === second;
  }
}

const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000 });
const migrationDirectory = resolve("prisma/client-runtime/migrations");

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS lf_cms_schema_migrations (
    migration_name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  for (const migrationName of migrations) {
    const applied = await pool.query(
      "SELECT 1 FROM lf_cms_schema_migrations WHERE migration_name = $1",
      [migrationName],
    );
    if (applied.rowCount) continue;
    const sql = await readFile(resolve(migrationDirectory, migrationName), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO lf_cms_schema_migrations(migration_name) VALUES ($1)",
        [migrationName],
      );
      await client.query("COMMIT");
      process.stdout.write(`Applied ${migrationName}\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
