import { getSupabaseServerAuthClient } from "@/server/supabase/server-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";

export type SessionUser = {
  id: string;
  email: string;
};

export async function requireUser(): Promise<SessionUser> {
  if (!isSupabaseBrowserConfigured()) {
    return {
      id: "mock-user-id",
      email: "hello@quotecraft.cn"
    };
  }

  const supabase = await getSupabaseServerAuthClient();

  if (!supabase) {
    throw new Error("Supabase auth client is unavailable.");
  }

  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;

  if (!claims?.sub) {
    throw new Error("Unauthorized");
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : ""
  };
}
