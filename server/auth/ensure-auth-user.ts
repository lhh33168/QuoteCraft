import { getSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseServerConfigured } from "@/server/supabase/keys";

type EnsureAuthUserResult = {
  ok: boolean;
  error?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function ensureAuthUser(
  email: string,
  t?: (path: string, values?: Record<string, string | number>) => string
): Promise<EnsureAuthUserResult> {
  if (!isSupabaseServerConfigured()) {
    return {
      ok: false,
      error: t?.("api.auth.ensureUserFailed") ?? "Failed to initialize the account for first-time login."
    };
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      error: t?.("api.auth.clientInitFailed") ?? "Failed to initialize the Supabase Auth client."
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
