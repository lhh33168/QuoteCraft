import { NextRequest, NextResponse } from "next/server";
import { createRouteAuthClient } from "@/server/supabase/route-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";

type SessionDebugPayload = {
  ok: boolean;
  timestamp: string;
  auth: {
    browserConfigured: boolean;
    hasSupabaseAuthCookie: boolean;
    authCookieNames: string[];
    session: {
      exists: boolean;
      accessTokenPreview: string | null;
      refreshTokenPreview: string | null;
      expiresAt: number | null;
    };
    user: {
      exists: boolean;
      id: string | null;
      email: string | null;
    };
    claims: {
      sub: string | null;
      email: string | null;
    };
  };
  errors: string[];
};

function maskToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  if (token.length <= 12) {
    return token;
  }

  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

export async function GET(request: NextRequest) {
  const authCookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-") && name.includes("auth-token"));

  const payload: SessionDebugPayload = {
    ok: true,
    timestamp: new Date().toISOString(),
    auth: {
      browserConfigured: isSupabaseBrowserConfigured(),
      hasSupabaseAuthCookie: authCookieNames.length > 0,
      authCookieNames,
      session: {
        exists: false,
        accessTokenPreview: null,
        refreshTokenPreview: null,
        expiresAt: null
      },
      user: {
        exists: false,
        id: null,
        email: null
      },
      claims: {
        sub: null,
        email: null
      }
    },
    errors: []
  };

  if (!payload.auth.browserConfigured) {
    return NextResponse.json(payload);
  }

  const response = NextResponse.json(payload);
  const supabase = createRouteAuthClient(request, response);

  if (!supabase) {
    payload.ok = false;
    payload.errors.push("Supabase Auth 客户端初始化失败。");
    return NextResponse.json(payload, { status: 500 });
  }

  const [sessionResult, userResult, claimsResult] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
    supabase.auth.getClaims()
  ]);

  if (sessionResult.error) {
    payload.ok = false;
    payload.errors.push(`getSession: ${sessionResult.error.message}`);
  }

  if (userResult.error) {
    payload.ok = false;
    payload.errors.push(`getUser: ${userResult.error.message}`);
  }

  if (claimsResult.error) {
    payload.ok = false;
    payload.errors.push(`getClaims: ${claimsResult.error.message}`);
  }

  const session = sessionResult.data.session;
  const user = userResult.data.user;
  const claims = claimsResult.data?.claims;

  payload.auth.session = {
    exists: Boolean(session),
    accessTokenPreview: maskToken(session?.access_token),
    refreshTokenPreview: maskToken(session?.refresh_token),
    expiresAt: session?.expires_at ?? null
  };
  payload.auth.user = {
    exists: Boolean(user),
    id: user?.id ?? null,
    email: user?.email ?? null
  };
  payload.auth.claims = {
    sub: typeof claims?.sub === "string" ? claims.sub : null,
    email: typeof claims?.email === "string" ? claims.email : null
  };

  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 500
  });
}
