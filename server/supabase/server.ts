import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerDataKey, getSupabaseUrl } from "@/server/supabase/keys";

export function getSupabaseServerClient() {
  const supabaseUrl = getSupabaseUrl();
  const serverKey = getSupabaseServerDataKey();

  if (!supabaseUrl || !serverKey) {
    return null;
  }

  return createClient(supabaseUrl, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
