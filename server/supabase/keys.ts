function normalizeEnvValue(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const lowered = trimmed.toLowerCase();

  if (
    lowered === "your-supabase-secret-key" ||
    lowered === "your-supabase-service-role-key" ||
    lowered === "your-openai-api-key" ||
    lowered.startsWith("your-")
  ) {
    return null;
  }

  return trimmed;
}

export function getSupabaseUrl() {
  return normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey() {
  return normalizeEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseServerDataKey() {
  return normalizeEnvValue(process.env.SUPABASE_SECRET_KEY) ?? normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isSupabaseBrowserConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function isSupabaseServerConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServerDataKey());
}
