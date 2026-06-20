import { cookies } from "next/headers";
import { getSupabaseServerAuthClient } from "@/server/supabase/server-auth";
import { isSupabaseBrowserConfigured } from "@/server/supabase/keys";

export type OptionalSessionUser = {
  id: string;
  email: string;
} | null;

export async function getOptionalUser(): Promise<OptionalSessionUser> {
  if (!isSupabaseBrowserConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const hasSupabaseAuthCookie = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));

  if (!hasSupabaseAuthCookie) {
    return null;
  }

  const supabase = await getSupabaseServerAuthClient();

  if (!supabase) {
    return null;
  }

  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;

  if (!claims?.sub) {
    return null;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : ""
  };
}
