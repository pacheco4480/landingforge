import "server-only";

import { auth } from "./auth";
import { getClientCmsPool } from "./database";
import {
  clientCmsInstallationSchema,
  clientCmsRoleSchema,
  permissionsForClientCmsRole,
  type ClientCmsActor,
  type ClientCmsPermission,
  type AuthorizedClientCmsContext,
} from "./contracts";

type AuthSession = {
  user?: { id?: string };
  clientCms?: {
    projectId?: string;
    role?: string;
    authorizationVersion?: number;
  };
};

export async function requireClientCmsActor(permission: ClientCmsPermission): Promise<AuthorizedClientCmsContext> {
  const session = await auth() as unknown as AuthSession | null;
  const sessionUser = session?.user;
  const claims = session?.clientCms;
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  const role = clientCmsRoleSchema.safeParse(claims?.role);
  if (!sessionUser?.id || !claims?.projectId || !projectId || claims.projectId !== projectId || !role.success) {
    throw new Error("Sessão CMS inválida ou sem acesso a esta instalação.");
  }
  const actor = {
    userId: sessionUser.id,
    projectId,
    role: role.data,
    authorizationVersion: claims.authorizationVersion ?? 0,
  } satisfies ClientCmsActor;
  if (!permissionsForClientCmsRole(actor.role).has(permission)) {
    throw new Error("Não tem permissão para executar esta operação.");
  }

  const result = await getClientCmsPool().query(
    `SELECT project_id, template_key, variant_key, template_version, source_checksum, capabilities
       FROM lf_cms_installations WHERE project_id = $1`,
    [actor.projectId],
  );
  const row = result.rows[0];
  if (!row) throw new Error("A instalação CMS não está provisionada.");
  const installation = clientCmsInstallationSchema.parse({
    projectId: row.project_id,
    templateKey: row.template_key,
    variantKey: row.variant_key,
    templateVersion: row.template_version,
    sourceChecksum: row.source_checksum,
    capabilities: row.capabilities,
  });
  const expectedVersion = process.env.CLIENT_CMS_TEMPLATE_VERSION;
  if (expectedVersion && expectedVersion !== installation.templateVersion) {
    throw new Error("A runtime CMS não corresponde à versão de template instalada.");
  }
  const userResult = await getClientCmsPool().query(
    `SELECT authorization_version FROM lf_cms_users
      WHERE project_id = $1 AND id = $2 AND is_active = true`,
    [actor.projectId, actor.userId],
  );
  if (!userResult.rows[0] || Number(userResult.rows[0].authorization_version) !== actor.authorizationVersion) {
    throw new Error("A sessão foi revogada. Inicia sessão novamente.");
  }
  return { ...actor, installation };
}

export function getActorInstallation(actor: AuthorizedClientCmsContext) {
  if (actor.installation.projectId !== actor.projectId) {
    throw new Error("O contexto da instalação não corresponde ao Project autorizado.");
  }
  return actor.installation;
}
