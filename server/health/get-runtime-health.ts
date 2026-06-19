import { env } from "@/server/config/env";
import {
  getSupabasePublishableKey,
  getSupabaseServerDataKey,
  getSupabaseUrl,
  isSupabaseBrowserConfigured,
  isSupabaseServerConfigured
} from "@/server/supabase/keys";

export function getRuntimeHealth() {
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();
  const supabaseServerKey = getSupabaseServerDataKey();

  return {
    app: {
      nodeEnv: process.env.NODE_ENV ?? "development",
      hasNodeModules: true
    },
    supabase: {
      hasUrl: Boolean(supabaseUrl),
      hasPublishableKey: Boolean(supabasePublishableKey),
      hasServerKey: Boolean(supabaseServerKey),
      browserConfigured: isSupabaseBrowserConfigured(),
      serverConfigured: isSupabaseServerConfigured()
    },
    openai: {
      hasApiKey: Boolean(env.OPENAI_API_KEY),
      model: env.OPENAI_MODEL ?? "gpt-5.5"
    }
  };
}
