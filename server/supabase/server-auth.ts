import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseBrowserConfigured } from "@/server/supabase/keys";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function getSupabaseServerAuthClient() {
  if (!isSupabaseBrowserConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          });
        } catch {
          // Cookie writes may be blocked in some server component contexts.
        }
      }
    }
  });
}
