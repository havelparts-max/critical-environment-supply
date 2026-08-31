import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isApiRoute = nextUrl.pathname.startsWith("/api/");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin");
  const isSignInRoute = nextUrl.pathname.startsWith("/sign-in");
  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/api/products") ||
    nextUrl.pathname.startsWith("/api/storefront") ||
    nextUrl.pathname.startsWith("/return-policy") ||
    nextUrl.pathname.startsWith("/about") ||
    nextUrl.pathname.startsWith("/product/") ||
    nextUrl.pathname.startsWith("/thank-you") ||
    nextUrl.pathname.startsWith("/api/merchant-feed");

  if (isSignInRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/orders", nextUrl));
    }
    return NextResponse.next();
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/sign-in", nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    if (isApiRoute) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/orders", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
