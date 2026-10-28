import { config } from "dotenv";
import { Client } from "pg";
import { spawnSync } from "node:child_process";

config({ path: [".env.local", ".env"] });

const source = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!source) throw new Error("É necessária uma URL PostgreSQL local para criar a base descartável.");

const adminUrl = new URL(source);
if (!["localhost", "127.0.0.1", "::1"].includes(adminUrl.hostname)) {
  throw new Error("Por segurança, este runner só cria bases de teste num PostgreSQL local.");
}
adminUrl.pathname = "/postgres";

const databaseName = `landingforge_privacy_test_${process.pid}`;
const testUrl = new URL(source);
testUrl.pathname = `/${databaseName}`;
let created = false;

function run(command, args, env) {
  const result = spawnSync(command, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} terminou com código ${result.status}`);
}

try {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  created = true;
  await admin.end();

  const env = {
    ...process.env,
    DATABASE_URL: testUrl.toString(),
    DIRECT_URL: testUrl.toString(),
    RUN_PRIVACY_DB_INTEGRATION: "1",
  };
  run("npx", ["prisma", "migrate", "deploy"], env);
  run("npx", ["vitest", "run", "tests/privacy-workflow.test.ts", "tests/privacy-lifecycle.integration.test.ts"], env);
} finally {
  if (created) {
    const admin = new Client({ connectionString: adminUrl.toString() });
    await admin.connect();
    await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [databaseName]);
    await admin.query(`DROP DATABASE "${databaseName}"`);
    await admin.end();
  }
}
