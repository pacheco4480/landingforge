import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | undefined;

export function getClientCmsDatabaseUrl() {
  const url = process.env.CLIENT_CMS_DATABASE_URL?.trim();
  if (!url) throw new Error("CLIENT_CMS_DATABASE_URL não está configurada.");
  if (process.env.DATABASE_URL && refersToSameDatabase(url, process.env.DATABASE_URL.trim())) {
    throw new Error("A runtime CMS não pode usar a base de dados Master.");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("CLIENT_CMS_DATABASE_URL não é válida.");
  }
  if (!/^postgres(?:ql)?:$/.test(parsed.protocol)) {
    throw new Error("A runtime CMS requer PostgreSQL.");
  }
  if (process.env.NODE_ENV === "production" && parsed.hostname === "localhost") {
    throw new Error("A runtime CMS não pode usar uma base de dados local em produção.");
  }
  if (process.env.NODE_ENV === "production" && parsed.hostname !== "localhost" &&
      process.env.CLIENT_CMS_DATABASE_SSL !== "true" && parsed.searchParams.get("sslmode") !== "require") {
    throw new Error("A ligação PostgreSQL da runtime CMS tem de exigir TLS em produção.");
  }
  return url;
}

function refersToSameDatabase(first: string, second: string) {
  try {
    const a = new URL(first);
    const b = new URL(second);
    const protocol = (value: string) => value.replace(":", "").replace(/^postgresql$/, "postgres");
    return protocol(a.protocol) === protocol(b.protocol) && a.hostname.toLowerCase() === b.hostname.toLowerCase() &&
      (a.port || "5432") === (b.port || "5432") && decodeURIComponent(a.pathname) === decodeURIComponent(b.pathname);
  } catch {
    return first === second;
  }
}

export function getClientCmsPool() {
  if (!pool) {
    const configuredPoolSize = Number(process.env.CLIENT_CMS_DB_POOL_SIZE ?? 5);
    const max = Number.isInteger(configuredPoolSize) && configuredPoolSize >= 1 && configuredPoolSize <= 20
      ? configuredPoolSize
      : 5;
    pool = new Pool({
      connectionString: getClientCmsDatabaseUrl(),
      max,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      ssl: process.env.CLIENT_CMS_DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    });
  }
  return pool;
}

export async function closeClientCmsPool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}

export async function withClientCmsTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClientCmsPool().connect();
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
}

export type ClientCmsRow = QueryResultRow;
