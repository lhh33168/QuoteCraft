import { getSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseServerConfigured } from "@/server/supabase/keys";

type EnsureAuthUserResult = {
  ok: boolean;
  error?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function ensureAuthUser(email: string): Promise<EnsureAuthUserResult> {
  if (!isSupabaseServerConfigured()) {
    return {
      ok: false,
      error: "当前未配置 Supabase 服务端 Key，无法为首次登录邮箱创建账号。"
    };
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Supabase 服务端客户端初始化失败。"
    };
  }

  const normalizedEmail = normalizeEmail(email);

  const listResult = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (listResult.error) {
    return {
      ok: false,
      error: listResult.error.message
    };
  }

  const exists = (listResult.data?.users ?? []).some((user) => (user.email ?? "").toLowerCase() === normalizedEmail);

  if (exists) {
    return { ok: true };
  }

  const createResult = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true
  });

  if (createResult.error) {
    const normalizedMessage = createResult.error.message.toLowerCase();

    if (normalizedMessage.includes("already") || normalizedMessage.includes("exists")) {
      return { ok: true };
    }

    return {
      ok: false,
      error: createResult.error.message
    };
  }

  return { ok: true };
}
