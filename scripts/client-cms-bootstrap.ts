import { readFile } from "node:fs/promises";

import { createInitialClientCmsAdmin, bootstrapClientCmsInstallation } from "@/features/exports/client-runtime/cms/bootstrap.service";
import { closeClientCmsPool } from "@/features/exports/client-runtime/cms/database";

async function main() {
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  const snapshotPath = process.env.CLIENT_CMS_SNAPSHOT_FILE;
  const adminName = process.env.CLIENT_CMS_INITIAL_ADMIN_NAME;
  const adminEmail = process.env.CLIENT_CMS_INITIAL_ADMIN_EMAIL;
  const adminPassword = process.env.CLIENT_CMS_INITIAL_ADMIN_PASSWORD;
  if (!projectId || !snapshotPath || !adminName || !adminEmail || !adminPassword) {
    throw new Error("Configura as variáveis de instalação e do administrador inicial antes do bootstrap.");
  }
  const input = JSON.parse(await readFile(snapshotPath, "utf8")) as {
    projectId: string;
    sourceChecksum: string;
    snapshot: unknown;
  };
  if (input.projectId !== projectId) throw new Error("O ficheiro de snapshot não corresponde ao Project configurado.");
  const installation = await bootstrapClientCmsInstallation(input);
  const administrator = await createInitialClientCmsAdmin({
    projectId,
    name: adminName,
    email: adminEmail,
    password: adminPassword,
  });
  process.stdout.write(`${JSON.stringify({ installation, administrator })}\n`);
}

main().finally(closeClientCmsPool).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Falha no bootstrap CMS."}\n`);
  process.exitCode = 1;
});
