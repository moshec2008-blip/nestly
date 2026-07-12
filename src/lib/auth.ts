import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export type AuthSetupStatus = {
  isReady: boolean;
  missing: string[];
};

export function getAuthSetupStatus(): AuthSetupStatus {
  const missing = [
    !process.env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_ID" : null,
    !process.env.GOOGLE_CLIENT_SECRET ? "GOOGLE_CLIENT_SECRET" : null,
    !process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET
      ? "NEXTAUTH_SECRET"
      : null,
    !process.env.NEXTAUTH_URL ? "NEXTAUTH_URL" : null,
  ].filter(Boolean) as string[];

  return {
    isReady: missing.length === 0,
    missing,
  };
}

const authSetupStatus = getAuthSetupStatus();

export const authOptions: NextAuthOptions = {
  providers: authSetupStatus.isReady
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
      ]
    : [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider) {
        token.provider = account.provider;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? token.email ?? "";
        session.user.provider =
          typeof token.provider === "string" ? token.provider : "google";
      }

      return session;
    },
  },
};
