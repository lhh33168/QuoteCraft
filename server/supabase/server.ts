import { createClient } from "@supabase/supabase-js";
import { env } from "@/server/config/env";

export function getSupabaseServerClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
