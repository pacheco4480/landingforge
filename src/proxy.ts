import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isCmsEnabled } from "@/config/deployment";

const protectedPrefixes = [
  "/admin",
  "/analytics",
  "/branding",
  "/content",
  "/dashboard",
  "/forms",
  "/settings",
  "/leads",
  "/media",
  "/pages",
  "/seo",
];

export default auth((request) => {
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !isCmsEnabled()) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (isProtected && !request.auth) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/analytics/:path*",
    "/branding/:path*",
    "/content/:path*",
    "/dashboard/:path*",
    "/forms/:path*",
    "/settings/:path*",
    "/leads/:path*",
    "/media/:path*",
    "/pages/:path*",
    "/seo/:path*",
  ],
};
