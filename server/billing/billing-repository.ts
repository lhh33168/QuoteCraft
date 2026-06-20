import { isSupabaseBrowserConfigured, isSupabaseServerConfigured } from "@/server/supabase/keys";
import { getSupabaseServerClient } from "@/server/supabase/server";
import type { BillingLifecycleStatus, BillingOrderStatus, SubscriptionPlan, UpgradeRequestStatus } from "@/shared/types/billing";

type UserProfileRow = {
  id: string;
  email: string;
  plan_type: SubscriptionPlan;
  plan_status?: BillingLifecycleStatus | null;
  plan_expires_at?: string | null;
  project_limit: number | null;
  ai_monthly_limit: number | null;
  created_at: string;
  updated_at: string;
};

type UpgradeRequestRow = {
  id: string;
  user_id?: string;
  email?: string;
  plan_type?: SubscriptionPlan;
  plan_status?: BillingLifecycleStatus | null;
  plan_expires_at?: string | null;
  effective_plan?: SubscriptionPlan;
  company_name?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  current_plan: SubscriptionPlan;
  target_plan: SubscriptionPlan;
  status: UpgradeRequestStatus;
  note: string | null;
  created_at: string;
  updated_at?: string;
};

type BillingOrderRow = {
  id: string;
  user_id?: string;
  current_plan: SubscriptionPlan;
  target_plan: SubscriptionPlan;
  status: BillingOrderStatus;
  amount_label?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  payer_name?: string | null;
  payer_phone?: string | null;
  note?: string | null;
  reviewed_note?: string | null;
  created_at: string;
  updated_at?: string;
};

type BasicUserProfileRow = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

const FULL_USER_PROFILE_SELECT =
  "id, email, plan_type, plan_status, plan_expires_at, project_limit, ai_monthly_limit, created_at, updated_at";
const BASIC_USER_PROFILE_SELECT = "id, email, created_at, updated_at";
const UPGRADE_REQUEST_SELECT =
  "id, user_id, company_name, contact_name, contact_phone, current_plan, target_plan, status, note, created_at, updated_at";
const BILLING_ORDER_SELECT =
  "id, user_id, current_plan, target_plan, status, amount_label, payment_method, payment_reference, payer_name, payer_phone, note, reviewed_note, created_at, updated_at";

function getDefaultProfileLimits(plan: SubscriptionPlan) {
  if (plan === "pro") {
    return {
      project_limit: null,
      ai_monthly_limit: null
    } as const;
  }

  return {
    project_limit: 3,
    ai_monthly_limit: 10
  } as const;
}

function getDefaultPlanStatus(plan: SubscriptionPlan): BillingLifecycleStatus {
  return plan === "pro" ? "active" : "inactive";
}

function isUserProfileBillingColumnError(message: string | undefined) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes("user_profiles") &&
    (normalized.includes("plan_type") ||
      normalized.includes("plan_status") ||
      normalized.includes("plan_expires_at") ||
      normalized.includes("project_limit") ||
      normalized.includes("ai_monthly_limit"))
  );
}

function isSupabaseTableMissingError(message: string | undefined, tableName: string) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes(tableName.toLowerCase()) &&
    (normalized.includes("does not exist") ||
      normalized.includes("could not find") ||
      normalized.includes("not found"))
  );
}

function isUserProfilesRelationshipError(message: string | undefined) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return normalized.includes("user_profiles") && normalized.includes("relationship");
}

function normalizeUserProfile(row: Partial<UserProfileRow> & BasicUserProfileRow): UserProfileRow {
  const planType = row.plan_type === "pro" ? "pro" : "free";
  const defaults = getDefaultProfileLimits(planType);

  return {
    id: row.id,
    email: row.email,
    plan_type: planType,
    plan_status: row.plan_status ?? getDefaultPlanStatus(planType),
    plan_expires_at: row.plan_expires_at ?? null,
    project_limit: row.project_limit ?? defaults.project_limit,
    ai_monthly_limit: row.ai_monthly_limit ?? defaults.ai_monthly_limit,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function selectUserProfileEmailsByIds(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  userIds: string[]
) {
  if (!userIds.length) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase.from("user_profiles").select("id, email").in("id", userIds);

  if (error) {
    if (isSupabaseTableMissingError(error.message, "user_profiles")) {
      return new Map<string, string>();
    }

    throw new Error(error.message);
  }

  return new Map<string, string>(
    ((data as Array<{ id: string; email: string }> | null) ?? []).map((item) => [item.id, item.email])
  );
}

async function selectUserProfileById(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(FULL_USER_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (!error) {
    return data ? normalizeUserProfile(data as UserProfileRow) : null;
  }

  if (!isUserProfileBillingColumnError(error.message)) {
    throw new Error(error.message);
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("user_profiles")
    .select(BASIC_USER_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  return fallbackData ? normalizeUserProfile(fallbackData as BasicUserProfileRow) : null;
}

async function updateUserProfileEmail(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  email: string
) {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      email
    })
    .eq("id", userId)
    .select(FULL_USER_PROFILE_SELECT)
    .single();

  if (!error && data) {
    return normalizeUserProfile(data as UserProfileRow);
  }

  if (!isUserProfileBillingColumnError(error?.message)) {
    throw new Error(error?.message ?? "Failed to update user profile.");
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("user_profiles")
    .update({
      email
    })
    .eq("id", userId)
    .select(BASIC_USER_PROFILE_SELECT)
    .single();

  if (fallbackError || !fallbackData) {
    throw new Error(fallbackError?.message ?? "Failed to update user profile.");
  }

  return normalizeUserProfile(fallbackData as BasicUserProfileRow);
}

async function insertUserProfile(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  userId: string,
  email: string
) {
  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      id: userId,
      email,
      plan_type: "free",
      plan_status: "inactive",
      plan_expires_at: null,
      project_limit: 3,
      ai_monthly_limit: 10
    })
    .select(FULL_USER_PROFILE_SELECT)
    .single();

  if (!error && data) {
    return normalizeUserProfile(data as UserProfileRow);
  }

  if (!isUserProfileBillingColumnError(error?.message)) {
    throw new Error(error?.message ?? "Failed to create user profile.");
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("user_profiles")
    .insert({
      id: userId,
      email
    })
    .select(BASIC_USER_PROFILE_SELECT)
    .single();

  if (fallbackError || !fallbackData) {
    throw new Error(fallbackError?.message ?? "Failed to create user profile.");
  }

  return normalizeUserProfile(fallbackData as BasicUserProfileRow);
}

function shouldUseMockMode() {
  return !isSupabaseBrowserConfigured();
}

function requireSupabaseDataClient() {
  if (shouldUseMockMode()) {
    return null;
  }

  if (!isSupabaseServerConfigured()) {
    throw new Error("Supabase server key is not configured.");
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Failed to initialize Supabase server client.");
  }

  return supabase;
}

export const billingRepository = {
  async getUserProfileById(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return {
        id: userId,
        email: "",
        plan_type: "free" as const,
        plan_status: "inactive" as const,
        plan_expires_at: null,
        project_limit: 3,
        ai_monthly_limit: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies UserProfileRow;
    }

    return selectUserProfileById(supabase, userId);
  },

  async ensureUserProfile(userId: string, email: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return {
        id: userId,
        email,
        plan_type: "free" as const,
        plan_status: "inactive" as const,
        plan_expires_at: null,
        project_limit: 3,
        ai_monthly_limit: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies UserProfileRow;
    }

    const existing = await selectUserProfileById(supabase, userId);

    if (existing) {
      if (existing.email !== email) {
        return updateUserProfileEmail(supabase, userId, email);
      }

      return existing;
    }

    return insertUserProfile(supabase, userId, email);
  },

  async getProjectCount(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return 1;
    }

    const { count, error } = await supabase
      .from("projects")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  },

  async getAiUsageThisMonth(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return 2;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("ai_logs")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error) {
      if (isSupabaseTableMissingError(error.message, "ai_logs")) {
        return 0;
      }

      throw new Error(error.message);
    }

    return count ?? 0;
  },

  async getLatestUpgradeRequest(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("subscription_upgrade_requests")
      .select(UPGRADE_REQUEST_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isSupabaseTableMissingError(error.message, "subscription_upgrade_requests")) {
        return null;
      }

      throw new Error(error.message);
    }

    return (data as UpgradeRequestRow | null) ?? null;
  },

  async getLatestOrder(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("subscription_orders")
      .select(BILLING_ORDER_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isSupabaseTableMissingError(error.message, "subscription_orders")) {
        return null;
      }

      throw new Error(error.message);
    }

    return (data as BillingOrderRow | null) ?? null;
  },

  async listOrdersByUser(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return [] as BillingOrderRow[];
    }

    const { data, error } = await supabase
      .from("subscription_orders")
      .select(BILLING_ORDER_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isSupabaseTableMissingError(error.message, "subscription_orders")) {
        return [];
      }

      throw new Error(error.message);
    }

    return (data as BillingOrderRow[] | null) ?? [];
  },

  async createUpgradeRequest(
    userId: string,
    currentPlan: SubscriptionPlan,
    targetPlan: SubscriptionPlan,
    input?: {
      note?: string;
      companyName?: string;
      contactName?: string;
      contactPhone?: string;
    }
  ) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return {
        id: `mock-upgrade-${Date.now()}`,
        user_id: userId,
        company_name: input?.companyName?.trim() || null,
        contact_name: input?.contactName?.trim() || null,
        contact_phone: input?.contactPhone?.trim() || null,
        current_plan: currentPlan,
        target_plan: targetPlan,
        status: "pending" as const,
        note: input?.note?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies UpgradeRequestRow;
    }

    const { data: existingPending, error: pendingError } = await supabase
      .from("subscription_upgrade_requests")
      .select(UPGRADE_REQUEST_SELECT)
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      if (isSupabaseTableMissingError(pendingError.message, "subscription_upgrade_requests")) {
        throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
      }

      throw new Error(pendingError.message);
    }

    if (existingPending) {
      return existingPending as UpgradeRequestRow;
    }

    const { data, error } = await supabase
      .from("subscription_upgrade_requests")
      .insert({
        user_id: userId,
        company_name: input?.companyName?.trim() || null,
        contact_name: input?.contactName?.trim() || null,
        contact_phone: input?.contactPhone?.trim() || null,
        current_plan: currentPlan,
        target_plan: targetPlan,
        status: "pending",
        note: input?.note?.trim() || null
      })
      .select(UPGRADE_REQUEST_SELECT)
      .single();

    if (error || !data) {
      if (isSupabaseTableMissingError(error?.message, "subscription_upgrade_requests")) {
        throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
      }

      throw new Error(error?.message ?? "Failed to create upgrade request.");
    }

    return data as UpgradeRequestRow;
  },

  async createBillingOrder(
    userId: string,
    currentPlan: SubscriptionPlan,
    targetPlan: SubscriptionPlan,
    input?: {
      amountLabel?: string;
      paymentMethod?: string;
      paymentReference?: string;
      payerName?: string;
      payerPhone?: string;
      note?: string;
    }
  ) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return {
        id: `mock-order-${Date.now()}`,
        user_id: userId,
        current_plan: currentPlan,
        target_plan: targetPlan,
        status: "submitted" as const,
        amount_label: input?.amountLabel?.trim() || null,
        payment_method: input?.paymentMethod?.trim() || null,
        payment_reference: input?.paymentReference?.trim() || null,
        payer_name: input?.payerName?.trim() || null,
        payer_phone: input?.payerPhone?.trim() || null,
        note: input?.note?.trim() || null,
        reviewed_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies BillingOrderRow;
    }

    const { data, error } = await supabase
      .from("subscription_orders")
      .insert({
        user_id: userId,
        current_plan: currentPlan,
        target_plan: targetPlan,
        status: "submitted",
        amount_label: input?.amountLabel?.trim() || null,
        payment_method: input?.paymentMethod?.trim() || null,
        payment_reference: input?.paymentReference?.trim() || null,
        payer_name: input?.payerName?.trim() || null,
        payer_phone: input?.payerPhone?.trim() || null,
        note: input?.note?.trim() || null
      })
      .select(BILLING_ORDER_SELECT)
      .single();

    if (error || !data) {
      if (isSupabaseTableMissingError(error?.message, "subscription_orders")) {
        throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
      }

      throw new Error(error?.message ?? "Failed to create billing order.");
    }

    return data as BillingOrderRow;
  },

  async cancelLatestUpgradeRequest(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return {
        id: `mock-upgrade-${Date.now()}`,
        user_id: userId,
        current_plan: "free" as const,
        target_plan: "pro" as const,
        status: "canceled" as const,
        note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies UpgradeRequestRow;
    }

    const { data: existingPending, error: pendingError } = await supabase
      .from("subscription_upgrade_requests")
      .select(UPGRADE_REQUEST_SELECT)
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      if (isSupabaseTableMissingError(pendingError.message, "subscription_upgrade_requests")) {
        throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
      }

      throw new Error(pendingError.message);
    }

    if (!existingPending) {
      throw new Error("No pending upgrade request found.");
    }

    const { data, error } = await supabase
      .from("subscription_upgrade_requests")
      .update({
        status: "canceled"
      })
      .eq("id", existingPending.id)
      .select(UPGRADE_REQUEST_SELECT)
      .single();

    if (error || !data) {
      if (isSupabaseTableMissingError(error?.message, "subscription_upgrade_requests")) {
        throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
      }

      throw new Error(error?.message ?? "Failed to cancel upgrade request.");
    }

    return data as UpgradeRequestRow;
  },

  async listUpgradeRequests() {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return [
        {
          id: "mock-upgrade-1",
          user_id: "mock-user-id",
          email: "hello@quotecraft.cn",
          plan_type: "free" as const,
          plan_status: "inactive" as const,
          plan_expires_at: null,
          effective_plan: "free" as const,
          company_name: "QuoteCraft Studio",
          contact_name: "Liam",
          contact_phone: "13800000000",
          current_plan: "free" as const,
          target_plan: "pro" as const,
          status: "pending" as const,
          note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ] satisfies UpgradeRequestRow[];
    }

    const { data, error } = await supabase
      .from("subscription_upgrade_requests")
      .select(UPGRADE_REQUEST_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      if (isSupabaseTableMissingError(error.message, "subscription_upgrade_requests")) {
        return [];
      }

      if (isUserProfilesRelationshipError(error.message)) {
        return [];
      }

      throw new Error(error.message);
    }

    const items = (data as UpgradeRequestRow[] | null) ?? [];
    const userIds = items.map((item) => item.user_id).filter((value): value is string => Boolean(value));
    const emailMap = await selectUserProfileEmailsByIds(
      supabase,
      userIds
    );
    const profileMap = new Map<string, UserProfileRow>();

    if (userIds.length) {
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select(FULL_USER_PROFILE_SELECT)
        .in("id", userIds);

      if (profileError) {
        if (!isUserProfileBillingColumnError(profileError.message) && !isSupabaseTableMissingError(profileError.message, "user_profiles")) {
          throw new Error(profileError.message);
        }
      } else {
        for (const profile of ((profiles as UserProfileRow[] | null) ?? [])) {
          const normalized = normalizeUserProfile(profile);
          profileMap.set(normalized.id, normalized);
        }
      }
    }

    return items.map((item) => ({
      ...item,
      email: item.user_id ? emailMap.get(item.user_id) ?? "" : "",
      plan_type: item.user_id ? profileMap.get(item.user_id)?.plan_type ?? "free" : "free",
      plan_status: item.user_id ? profileMap.get(item.user_id)?.plan_status ?? "inactive" : "inactive",
      plan_expires_at: item.user_id ? profileMap.get(item.user_id)?.plan_expires_at ?? null : null,
      effective_plan:
        item.user_id && profileMap.get(item.user_id)?.plan_type === "pro" && profileMap.get(item.user_id)?.plan_status === "active"
          ? "pro"
          : "free"
    }));
  },

  async listBillingOrders() {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return [] as BillingOrderRow[];
    }

    const { data, error } = await supabase
      .from("subscription_orders")
      .select(BILLING_ORDER_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      if (isSupabaseTableMissingError(error.message, "subscription_orders")) {
        return [];
      }

      throw new Error(error.message);
    }

    return (data as BillingOrderRow[] | null) ?? [];
  },

  async updateUpgradeRequestStatus(requestId: string, status: UpgradeRequestStatus) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return {
        id: requestId,
        user_id: "mock-user-id",
        current_plan: "free" as const,
        target_plan: "pro" as const,
        status,
        note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies UpgradeRequestRow;
    }

    const { data, error } = await supabase
      .from("subscription_upgrade_requests")
      .update({
        status
      })
      .eq("id", requestId)
      .select(UPGRADE_REQUEST_SELECT)
      .single();

    if (error || !data) {
      if (isSupabaseTableMissingError(error?.message, "subscription_upgrade_requests")) {
        throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
      }

      throw new Error(error?.message ?? "Failed to update upgrade request.");
    }

    return data as UpgradeRequestRow;
  },

  async updateBillingOrderStatus(
    orderId: string,
    input: {
      status: BillingOrderStatus;
      reviewedNote?: string;
    }
  ) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return {
        id: orderId,
        user_id: "mock-user-id",
        current_plan: "free" as const,
        target_plan: "pro" as const,
        status: input.status,
        amount_label: "Pro / offline",
        payment_method: "bank_transfer",
        payment_reference: "MOCK-001",
        payer_name: "Mock User",
        payer_phone: "13800000000",
        note: null,
        reviewed_note: input.reviewedNote?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies BillingOrderRow;
    }

    const { data, error } = await supabase
      .from("subscription_orders")
      .update({
        status: input.status,
        reviewed_note: input.reviewedNote?.trim() || null
      })
      .eq("id", orderId)
      .select(BILLING_ORDER_SELECT)
      .single();

    if (error || !data) {
      if (isSupabaseTableMissingError(error?.message, "subscription_orders")) {
        throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
      }

      throw new Error(error?.message ?? "Failed to update billing order.");
    }

    return data as BillingOrderRow;
  },

  async updateUserPlan(userId: string, plan: SubscriptionPlan) {
    const supabase = requireSupabaseDataClient();

    const projectLimit = plan === "free" ? 3 : null;
    const aiMonthlyLimit = plan === "free" ? 10 : null;

    if (!supabase) {
      return {
        id: userId,
        email: "hello@quotecraft.cn",
        plan_type: plan,
        plan_status: plan === "pro" ? "active" : "inactive",
        plan_expires_at: null,
        project_limit: projectLimit,
        ai_monthly_limit: aiMonthlyLimit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies UserProfileRow;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        plan_type: plan,
        plan_status: plan === "pro" ? "active" : "inactive",
        plan_expires_at: null,
        project_limit: projectLimit,
        ai_monthly_limit: aiMonthlyLimit
      })
      .eq("id", userId)
      .select(FULL_USER_PROFILE_SELECT)
      .single();

    if (!error && data) {
      return normalizeUserProfile(data as UserProfileRow);
    }

    if (isUserProfileBillingColumnError(error?.message)) {
      throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
    }

    throw new Error(error?.message ?? "Failed to update user plan.");
  },

  async updateUserPlanLifecycle(
    userId: string,
    input: {
      plan?: SubscriptionPlan;
      planStatus?: BillingLifecycleStatus;
      planExpiresAt?: string | null;
    }
  ) {
    const supabase = requireSupabaseDataClient();
    const nextPlan = input.plan ?? "free";
    const nextStatus = input.planStatus ?? getDefaultPlanStatus(nextPlan);
    const nextProjectLimit = nextPlan === "free" ? 3 : null;
    const nextAiLimit = nextPlan === "free" ? 10 : null;

    if (!supabase) {
      return {
        id: userId,
        email: "hello@quotecraft.cn",
        plan_type: nextPlan,
        plan_status: nextStatus,
        plan_expires_at: input.planExpiresAt ?? null,
        project_limit: nextProjectLimit,
        ai_monthly_limit: nextAiLimit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies UserProfileRow;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        plan_type: nextPlan,
        plan_status: nextStatus,
        plan_expires_at: input.planExpiresAt ?? null,
        project_limit: nextProjectLimit,
        ai_monthly_limit: nextAiLimit
      })
      .eq("id", userId)
      .select(FULL_USER_PROFILE_SELECT)
      .single();

    if (!error && data) {
      return normalizeUserProfile(data as UserProfileRow);
    }

    if (isUserProfileBillingColumnError(error?.message)) {
      throw new Error("Supabase schema is outdated. Please rerun supabase-schema-and-rls.sql.");
    }

    throw new Error(error?.message ?? "Failed to update billing lifecycle.");
  }
};
