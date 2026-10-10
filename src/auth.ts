import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/features/auth/schemas/auth.schema";
import { authenticateUser } from "@/features/auth/services/auth.service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return authenticateUser(parsed.data.email, parsed.data.password);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.roles = Array.isArray(user.roles) ? user.roles : [];
        token.permissions = Array.isArray(user.permissions)
          ? user.permissions
          : [];
        token.authorizationVersion =
          typeof user.authorizationVersion === "number"
            ? user.authorizationVersion
            : 1;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.roles = Array.isArray(token.roles)
        ? token.roles.filter((role): role is string => typeof role === "string")
        : [];
      session.user.permissions = Array.isArray(token.permissions)
        ? token.permissions.filter(
            (permission): permission is string =>
              typeof permission === "string",
          )
        : [];
      session.user.authorizationVersion =
        typeof token.authorizationVersion === "number"
          ? token.authorizationVersion
          : 1;
      return session;
    },
  },
});
