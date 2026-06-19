import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/server/supabase/middleware";

const protectedPrefixes = ["/workspace", "/projects", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/share")) {
    return NextResponse.next();
  }

  const sessionState = await updateSession(request);

  if (sessionState.skipped) {
    return sessionState.response;
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !sessionState.authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return sessionState.response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
