import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createRouteAuthClient } from "@/server/supabase/route-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";
import { createRequestTranslator } from "@/shared/i18n/server";

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/workspace";
  }

  return value;
}

function mapCallbackError(errorMessage: string, t: (path: string, values?: Record<string, string | number>) => string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("expired")) {
    return t("api.auth.callbackExpired");
  }

  if (normalized.includes("invalid")) {
    return t("api.auth.callbackInvalid");
  }

  if (normalized.includes("otp")) {
    return t("api.auth.callbackOtpFailed");
  }

  return t("api.auth.callbackGeneric");
}

export async function GET(request: NextRequest) {
  const { t } = createRequestTranslator(request);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = normalizeNextPath(requestUrl.searchParams.get("next") ?? "/workspace");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!isSupabaseBrowserConfigured()) {
    return NextResponse.redirect(redirectUrl);
  }

  if (errorDescription) {
    const homeUrl = new URL("/", requestUrl.origin);
    homeUrl.searchParams.set("error", mapCallbackError(errorDescription, t));
    return NextResponse.redirect(homeUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  const supabase = createRouteAuthClient(request, response);

  if (!supabase) {
    return response;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const homeUrl = new URL("/", requestUrl.origin);
      homeUrl.searchParams.set("error", mapCallbackError(error.message, t));
      return NextResponse.redirect(homeUrl);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType
    });

    if (error) {
      const homeUrl = new URL("/", requestUrl.origin);
      homeUrl.searchParams.set("error", mapCallbackError(error.message, t));
      return NextResponse.redirect(homeUrl);
    }
  }

  return response;
}
