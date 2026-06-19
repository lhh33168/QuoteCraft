import { NextRequest, NextResponse } from "next/server";
import { createRouteAuthClient } from "@/server/supabase/route-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";

function mapVerifyError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("expired")) {
    return {
      status: 400,
      message: "验证码已过期，请重新获取。"
    };
  }

  if (normalized.includes("invalid")) {
    return {
      status: 400,
      message: "验证码无效，请检查后重新输入。"
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
    token?: string;
    next?: string;
  };

  if (!body.email || !body.token) {
    return NextResponse.json(
      {
        error: "邮箱和验证码不能为空。"
      },
      { status: 400 }
    );
  }

  if (!isSupabaseBrowserConfigured()) {
    return NextResponse.json(
      {
        error: "当前尚未配置 Supabase，无法验证邮箱验证码。"
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    message: "登录成功。"
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

  const { error } = await supabase.auth.verifyOtp({
    email: body.email,
    token: body.token,
    type: "email"
  });

  if (error) {
    const mapped = mapVerifyError(error.message);
    return NextResponse.json(
      {
        error: mapped.message
      },
      { status: mapped.status }
    );
  }

  return response;
}
