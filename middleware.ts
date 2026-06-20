import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/server/supabase/middleware";

const protectedPrefixes = ["/workspace", "/projects", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (pathname.startsWith("/share") || pathname.startsWith("/api") || !isProtected) {
    return NextResponse.next();
  }

  const sessionState = await updateSession(request);

  if (sessionState.skipped) {
    return sessionState.response;
  }

  if (isProtected && !sessionState.authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return sessionState.response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
