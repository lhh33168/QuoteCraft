import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createRouteAuthClient } from "@/server/supabase/route-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/workspace";
  }

  return value;
}

function mapCallbackError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("expired")) {
    return "邮件中的兜底验证信息已过期，请返回登录页重新获取验证码。";
  }

  if (normalized.includes("invalid")) {
    return "邮件中的兜底验证信息无效，请返回登录页重新获取验证码。";
  }

  if (normalized.includes("otp")) {
    return "邮箱兜底验证失败，请回到登录页重新发送新的验证码邮件。";
  }

  return "邮件兜底验证失败，请返回登录页重新尝试验证码登录。";
}

export async function GET(request: NextRequest) {
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
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", mapCallbackError(errorDescription));
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  const supabase = createRouteAuthClient(request, response);

  if (!supabase) {
    return response;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("next", next);
      loginUrl.searchParams.set("error", mapCallbackError(error.message));
      return NextResponse.redirect(loginUrl);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType
    });

    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("next", next);
      loginUrl.searchParams.set("error", mapCallbackError(error.message));
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
