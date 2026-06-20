import { NextRequest, NextResponse } from "next/server";
import { ensureAuthUser } from "@/server/auth/ensure-auth-user";
import { verifyLoginCaptcha } from "@/server/auth/login-captcha";
import { createSendCooldownToken, verifySendCooldown } from "@/server/auth/login-send-rate-limit";
import { createRouteAuthClient } from "@/server/supabase/route-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";
import { EMAIL_OTP_LENGTH } from "@/shared/constants/auth";

const SEND_COOLDOWN_COOKIE = "quotecraft-login-send-cooldown";

function mapAuthError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("email rate limit exceeded")) {
    return {
      status: 429,
      message: "邮件发送过于频繁，请等待 60 秒后重试，或更换一个邮箱继续。"
    };
  }

  if (normalized.includes("invalid email")) {
    return {
      status: 400,
      message: "邮箱格式不正确，请检查后重新输入。"
    };
  }

  return {
    status: 400,
    message: errorMessage
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    captchaToken?: string;
    captchaAnswer?: string;
    next?: string;
  };

  if (!body.email) {
    return NextResponse.json(
      {
        error: "邮箱不能为空。"
      },
      { status: 400 }
    );
  }

  const captchaCheck = verifyLoginCaptcha(body.captchaToken ?? "", body.captchaAnswer ?? "");

  if (!captchaCheck.ok) {
    return NextResponse.json(
      {
        error: captchaCheck.message
      },
      { status: 400 }
    );
  }

  const cooldownState = verifySendCooldown(request.cookies.get(SEND_COOLDOWN_COOKIE)?.value, body.email);

  if (!cooldownState.allowed) {
    return NextResponse.json(
      {
        error: `发送过于频繁，请在 ${cooldownState.retryAfterSeconds} 秒后重试。`,
        retryAfterSeconds: cooldownState.retryAfterSeconds
      },
      { status: 429 }
    );
  }

  if (!isSupabaseBrowserConfigured()) {
    return NextResponse.json({
      message: "当前尚未配置 Supabase，系统仍处于本地演示模式。补齐环境变量后即可发送真实登录邮件。"
    });
  }

  const ensureUserResult = await ensureAuthUser(body.email);

  if (!ensureUserResult.ok) {
    return NextResponse.json(
      {
        error: ensureUserResult.error ?? "首次登录账号初始化失败，请稍后重试。"
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    message: `验证码已发送，请前往邮箱查看 ${EMAIL_OTP_LENGTH} 位数字验证码完成登录。`,
    retryAfterSeconds: 60
  });
  const supabase = createRouteAuthClient(request, response);

  if (!supabase) {
    return NextResponse.json(
      {
        error: "Supabase Auth 客户端初始化失败。"
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
    const mapped = mapAuthError(error.message);
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
