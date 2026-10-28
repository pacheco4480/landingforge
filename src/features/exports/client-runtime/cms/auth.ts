import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "argon2";
import { createHmac } from "node:crypto";
import { z } from "zod";

import { getClientCmsPool } from "./database";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(200),
});

type AuthenticatedClientUser = {
  id: string;
  name: string;
  email: string;
  clientCmsProjectId: string;
  clientCmsRole: "client_admin" | "viewer";
  authorizationVersion: number;
  roles: string[];
  permissions: string[];
};

export async function authenticateClientCmsUser(input: unknown): Promise<AuthenticatedClientUser | null> {
  const credentials = credentialsSchema.safeParse(input);
  const projectId = process.env.CLIENT_CMS_PROJECT_ID;
  if (!credentials.success || !projectId) return null;
  const rateLimitSecret = process.env.CLIENT_CMS_RATE_LIMIT_SECRET;
  if (!rateLimitSecret) throw new Error("A proteção de autenticação não está configurada.");
  const rateLimitKey = createHmac("sha256", rateLimitSecret)
    .update(`login:${credentials.data.email}`)
    .digest("hex");
  const limit = await getClientCmsPool().query(
    `INSERT INTO lf_cms_auth_limits(project_id, key_hash, window_started_at, request_count)
     VALUES ($1, $2, now(), 1)
     ON CONFLICT (project_id, key_hash) DO UPDATE SET
       request_count = CASE
         WHEN lf_cms_auth_limits.window_started_at < now() - interval '15 minutes' THEN 1
         ELSE lf_cms_auth_limits.request_count + 1
       END,
       window_started_at = CASE
         WHEN lf_cms_auth_limits.window_started_at < now() - interval '15 minutes' THEN now()
         ELSE lf_cms_auth_limits.window_started_at
       END
     RETURNING request_count`,
    [projectId, rateLimitKey],
  );
  if (Number(limit.rows[0]?.request_count) > 10) return null;
  const result = await getClientCmsPool().query(
    `SELECT id, name, email, password_hash, role, authorization_version
       FROM lf_cms_users
      WHERE project_id = $1 AND email = $2 AND is_active = true`,
    [projectId, credentials.data.email],
  );
  const user = result.rows[0];
  if (!user) return null;
  const passwordMatches = await verify(String(user.password_hash), credentials.data.password).catch(() => false);
  if (!passwordMatches) return null;
  await getClientCmsPool().query(
    `UPDATE lf_cms_users SET last_login_at = now(), updated_at = now()
      WHERE project_id = $1 AND id = $2`,
    [projectId, user.id],
  );
  return {
    id: String(user.id),
    name: String(user.name),
    email: String(user.email),
    clientCmsProjectId: projectId,
    clientCmsRole: String(user.role) as AuthenticatedClientUser["clientCmsRole"],
    authorizationVersion: Number(user.authorization_version),
    roles: [String(user.role)],
    permissions: [],
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/cms/login", error: "/cms/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    authorize: (credentials) => authenticateClientCmsUser(credentials),
  })],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const clientUser = user as typeof user & Partial<AuthenticatedClientUser>;
        token.clientCmsProjectId = clientUser.clientCmsProjectId;
        token.clientCmsRole = clientUser.clientCmsRole;
        token.clientCmsAuthorizationVersion = clientUser.authorizationVersion;
      }
      return token;
    },
    session({ session, token }) {
      Object.assign(session, {
        clientCms: {
          projectId: token.clientCmsProjectId,
          role: token.clientCmsRole,
          authorizationVersion: token.clientCmsAuthorizationVersion,
        },
      });
      session.user.id = token.sub ?? "";
      return session;
    },
  },
});
