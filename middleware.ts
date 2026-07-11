export { default } from "next-auth/middleware";

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
