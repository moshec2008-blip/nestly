import type { NextAuthOptions } from "next-auth";

// התחברות עם Google מנוטרלת בינתיים — האפליקציה פועלת במצב בסיסי (מקומי) בלבד.
// כדי להחזיר: לשחזר את GoogleProvider ואת getAuthSetupStatus מהיסטוריית הגיט.
export const authOptions: NextAuthOptions = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};
