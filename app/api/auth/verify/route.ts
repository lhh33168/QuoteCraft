import { NextRequest, NextResponse } from "next/server";
import { createRouteAuthClient } from "@/server/supabase/route-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";
import { createRequestTranslator } from "@/shared/i18n/server";

function mapVerifyError(errorMessage: string, t: (path: string, values?: Record<string, string | number>) => string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("expired")) {
    return {
      status: 400,
      message: t("api.auth.verifyExpired")
    };
  }

  if (normalized.includes("invalid")) {
    return {
      status: 400,
      message: t("api.auth.verifyInvalid")
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
    token?: string;
    next?: string;
  };

  if (!body.email || !body.token) {
    return NextResponse.json(
      {
        error: t("api.auth.verifyEmailAndCodeRequired")
      },
      { status: 400 }
    );
  }

  if (!isSupabaseBrowserConfigured()) {
    return NextResponse.json(
      {
        error: t("api.auth.verifySupabaseUnavailable")
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    message: t("api.auth.loginSuccess")
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

  const { error } = await supabase.auth.verifyOtp({
    email: body.email,
    token: body.token,
    type: "email"
  });

  if (error) {
    const mapped = mapVerifyError(error.message, t);
    return NextResponse.json(
      {
        error: mapped.message
      },
      { status: mapped.status }
    );
  }

  return response;
}
