import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export function getAuthSetupStatus() {
  const hasGoogleClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
  const hasGoogleClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
  const hasSecret = Boolean(process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET);
  const hasUrl = Boolean(process.env.NEXTAUTH_URL ?? process.env.AUTH_URL);

  return {
    hasGoogleClientId,
    hasGoogleClientSecret,
    hasSecret,
    hasUrl,
    googleConfigured: hasGoogleClientId && hasGoogleClientSecret,
    readyForProduction:
      hasGoogleClientId && hasGoogleClientSecret && hasSecret && hasUrl,
  };
}

const authSetup = getAuthSetupStatus();

const providers = authSetup.googleConfigured
  ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        allowDangerousEmailAccountLinking: false,
      }),
    ]
  : [];

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider) {
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.provider =
          typeof token.provider === "string" ? token.provider : "google";
      }

      return session;
    },
  },
};
