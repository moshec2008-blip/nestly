import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
});

export const config = {
  matcher: [
    "/",
    "/finance/:path*",
    "/tasks/:path*",
    "/shopping/:path*",
    "/family/:path*",
    "/birthdays/:path*",
    "/family-events/:path*",
    "/documents/:path*",
    "/vehicles/:path*",
    "/health/:path*",
    "/settings/:path*",
    "/permissions/:path*",
    "/security/:path*",
    "/dashboard/:path*",
  ],
};
