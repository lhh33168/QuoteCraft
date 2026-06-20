import { NextRequest, NextResponse } from "next/server";
import { ensureAuthUser } from "@/server/auth/ensure-auth-user";
import { createSendCooldownToken, verifySendCooldown } from "@/server/auth/login-send-rate-limit";
import { createRouteAuthClient } from "@/server/supabase/route-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";
import { EMAIL_OTP_LENGTH } from "@/shared/constants/auth";
import { createRequestTranslator } from "@/shared/i18n/server";

const SEND_COOLDOWN_COOKIE = "quotecraft-login-send-cooldown";

function mapAuthError(errorMessage: string, t: (path: string, values?: Record<string, string | number>) => string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("email rate limit exceeded")) {
    return {
      status: 429,
      message: t("api.auth.rateLimitExceeded")
    };
  }

  if (normalized.includes("invalid email")) {
    return {
      status: 400,
      message: t("api.auth.invalidEmail")
    };
  }

  return {
    status: 400,
    message: errorMessage
  };
}

export async function POST(request: NextRequest) {
  const { t } = createRequestTranslator(request);
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    next?: string;
  };

  if (!body.email) {
    return NextResponse.json(
      {
        error: t("api.auth.loginEmailRequired")
      },
      { status: 400 }
    );
  }

  const cooldownState = verifySendCooldown(request.cookies.get(SEND_COOLDOWN_COOKIE)?.value, body.email);

  if (!cooldownState.allowed) {
    return NextResponse.json(
      {
        error: t("api.auth.loginCooldown", {
          seconds: cooldownState.retryAfterSeconds
        }),
        retryAfterSeconds: cooldownState.retryAfterSeconds
      },
      { status: 429 }
    );
  }

  if (!isSupabaseBrowserConfigured()) {
    return NextResponse.json({
      message: t("api.auth.demoMode")
    });
  }

  const ensureUserResult = await ensureAuthUser(body.email, t);

  if (!ensureUserResult.ok) {
    return NextResponse.json(
      {
        error: ensureUserResult.error ?? t("api.auth.ensureUserFailed")
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    message: t("api.auth.codeSent", {
      length: EMAIL_OTP_LENGTH
    }),
    retryAfterSeconds: 60
  });
  const supabase = createRouteAuthClient(request, response);

  if (!supabase) {
    return NextResponse.json(
      {
        error: t("api.auth.clientInitFailed")
      },
      { status: 500 }
    );
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: body.email,
    options: {
      shouldCreateUser: false
    }
  });

  if (error) {
    const mapped = mapAuthError(error.message, t);
    return NextResponse.json(
      {
        error: mapped.message
      },
      { status: mapped.status }
    );
  }

  response.cookies.set(SEND_COOLDOWN_COOKIE, createSendCooldownToken(body.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60
  });

  return response;
}
