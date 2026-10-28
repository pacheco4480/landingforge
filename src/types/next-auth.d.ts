import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    roles: string[];
    permissions: string[];
    authorizationVersion: number;
    clientCmsProjectId?: string;
    clientCmsRole?: "client_admin" | "viewer";
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: string[];
      permissions: string[];
      authorizationVersion: number;
    };
    clientCms?: {
      projectId?: string;
      role?: "client_admin" | "viewer";
      authorizationVersion?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    permissions?: string[];
    authorizationVersion?: number;
    clientCmsProjectId?: string;
    clientCmsRole?: "client_admin" | "viewer";
    clientCmsAuthorizationVersion?: number;
  }
}
