import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    roles: string[];
    permissions: string[];
    authorizationVersion: number;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: string[];
      permissions: string[];
      authorizationVersion: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    permissions?: string[];
    authorizationVersion?: number;
  }
}
