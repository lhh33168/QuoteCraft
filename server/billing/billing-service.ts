import { billingRepository } from "@/server/billing/billing-repository";
import { BILLING_PLAN_ORDER, getPlanEntitlements } from "@/server/billing/plan-config";
import { isAdminEmail, requireAdminUser } from "@/server/auth/require-admin-user";
import { requireUser } from "@/server/auth/require-user";
import type {
  BillingLifecycleStatus,
  BillingOrder,
  BillingOrderStatus,
  BillingSnapshot,
  SubscriptionPlan,
  UpgradeRequestStatus
} from "@/shared/types/billing";

type BillingGuardFeature = "project_create" | "ai_generate" | "share_access" | "export_pdf";

function calculateRemaining(limit: number | null, current: number) {
  if (limit === null) {
    return null;
  }

  return Math.max(limit - current, 0);
}

function getRecommendedPlan(plan: SubscriptionPlan, projectRemaining: number | null, aiRemaining: number | null) {
  if (plan === "pro") {
    return null;
  }

  if (projectRemaining === 0 || aiRemaining === 0) {
    return "pro" as const;
  }

  return "pro" as const;
}

function resolveLifecycleStatus(
  plan: SubscriptionPlan,
  rawStatus: BillingLifecycleStatus | null | undefined,
  expiresAt: string | null | undefined
) {
  if (plan === "free") {
    return "inactive" as const;
  }

  if (rawStatus === "expired") {
    return "expired" as const;
  }

  if (expiresAt) {
    const expireDate = new Date(expiresAt);

    if (!Number.isNaN(expireDate.getTime()) && expireDate.getTime() <= Date.now()) {
      return "expired" as const;
    }
  }

  return rawStatus === "inactive" ? "inactive" : "active";
}

function getEffectivePlan(plan: SubscriptionPlan, lifecycleStatus: BillingLifecycleStatus) {
  if (plan === "pro" && lifecycleStatus === "active") {
    return "pro" as const;
  }

  return "free" as const;
}

function buildEntitlementsForProfile(
  profile: {
    plan_type: SubscriptionPlan;
    plan_status?: BillingLifecycleStatus | null;
    plan_expires_at?: string | null;
    project_limit: number | null;
    ai_monthly_limit: number | null;
  }
): {
  lifecycleStatus: BillingLifecycleStatus;
  effectivePlan: SubscriptionPlan;
  entitlements: ReturnType<typeof getPlanEntitlements>;
} {
  const lifecycleStatus = resolveLifecycleStatus(profile.plan_type, profile.plan_status, profile.plan_expires_at);
  const effectivePlan = getEffectivePlan(profile.plan_type, lifecycleStatus);

  return {
    lifecycleStatus,
    effectivePlan,
    entitlements: {
      ...getPlanEntitlements(effectivePlan),
      projectLimit: effectivePlan === "pro" ? profile.project_limit ?? getPlanEntitlements("pro").projectLimit : 3,
      aiMonthlyLimit: effectivePlan === "pro" ? profile.ai_monthly_limit ?? getPlanEntitlements("pro").aiMonthlyLimit : 10
    }
  };
}

function isValidLifecycleStatus(value: string): value is BillingLifecycleStatus {
  return value === "active" || value === "expired" || value === "inactive";
}

function mapBillingOrder(order: {
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
}): BillingOrder {
  return {
    id: order.id,
    userId: order.user_id,
    currentPlan: order.current_plan,
    targetPlan: order.target_plan,
    status: order.status,
    amountLabel: order.amount_label ?? null,
    paymentMethod: order.payment_method ?? null,
    paymentReference: order.payment_reference ?? null,
    payerName: order.payer_name ?? null,
    payerPhone: order.payer_phone ?? null,
    note: order.note ?? null,
    reviewedNote: order.reviewed_note ?? null,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
}

export class BillingLimitError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const billingService = {
  async getSnapshot(): Promise<BillingSnapshot> {
    const user = await requireUser();
    const profile = await billingRepository.ensureUserProfile(user.id, user.email);
    const [projectCount, aiGeneratedThisMonth, latestUpgradeRequest, latestOrder, orders] = await Promise.all([
      billingRepository.getProjectCount(user.id),
      billingRepository.getAiUsageThisMonth(user.id),
      billingRepository.getLatestUpgradeRequest(user.id),
      billingRepository.getLatestOrder(user.id),
      billingRepository.listOrdersByUser(user.id)
    ]);
    const { lifecycleStatus, effectivePlan, entitlements } = buildEntitlementsForProfile(profile);
    const projectRemaining = calculateRemaining(entitlements.projectLimit, projectCount);
    const aiRemaining = calculateRemaining(entitlements.aiMonthlyLimit, aiGeneratedThisMonth);

    return {
      email: profile.email,
      plan: effectivePlan,
      effectivePlan,
      subscriptionPlan: profile.plan_type,
      lifecycleStatus,
      expiresAt: profile.plan_expires_at ?? null,
      isAdmin: isAdminEmail(profile.email),
      entitlements,
      usage: {
        projectCount,
        projectLimit: entitlements.projectLimit,
        projectRemaining,
        aiGeneratedThisMonth,
        aiMonthlyLimit: entitlements.aiMonthlyLimit,
        aiRemaining
      },
      upgradeRequest: latestUpgradeRequest
        ? {
            id: latestUpgradeRequest.id,
            companyName: latestUpgradeRequest.company_name ?? null,
            contactName: latestUpgradeRequest.contact_name ?? null,
            contactPhone: latestUpgradeRequest.contact_phone ?? null,
            currentPlan: latestUpgradeRequest.current_plan,
            targetPlan: latestUpgradeRequest.target_plan,
            status: latestUpgradeRequest.status,
            createdAt: latestUpgradeRequest.created_at,
            updatedAt: latestUpgradeRequest.updated_at,
            note: latestUpgradeRequest.note
          }
        : null,
      latestOrder: latestOrder ? mapBillingOrder(latestOrder) : null,
      orders: orders.map(mapBillingOrder),
      recommendedPlan: getRecommendedPlan(profile.plan_type, projectRemaining, aiRemaining),
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  },

  async assertCanUse(feature: BillingGuardFeature) {
    const snapshot = await this.getSnapshot();

    if (feature === "project_create") {
      if (snapshot.usage.projectLimit !== null && snapshot.usage.projectCount >= snapshot.usage.projectLimit) {
        throw new BillingLimitError("PROJECT_LIMIT_REACHED", "You have reached your current project limit.");
      }

      return snapshot;
    }

    if (feature === "ai_generate") {
      if (
        snapshot.usage.aiMonthlyLimit !== null &&
        snapshot.usage.aiGeneratedThisMonth >= snapshot.usage.aiMonthlyLimit
      ) {
        throw new BillingLimitError("AI_LIMIT_REACHED", "You have reached your monthly AI generation limit.");
      }

      return snapshot;
    }

    if (feature === "share_access") {
      if (!snapshot.entitlements.shareEnabled) {
        throw new BillingLimitError("SHARE_DISABLED", "Your current plan does not include client sharing.");
      }

      return snapshot;
    }

    if (feature === "export_pdf") {
      if (!snapshot.entitlements.exportPdfEnabled) {
        throw new BillingLimitError("EXPORT_PDF_DISABLED", "Your current plan does not include PDF export.");
      }

      return snapshot;
    }

    return snapshot;
  },

  async getEntitlementsByUserId(userId: string) {
    const profile = await billingRepository.getUserProfileById(userId);

    if (!profile) {
      return {
        lifecycleStatus: "inactive" as const,
        effectivePlan: "free" as const,
        entitlements: getPlanEntitlements("free")
      };
    }

    return buildEntitlementsForProfile(profile);
  },

  async assertUserCanUse(userId: string, feature: Exclude<BillingGuardFeature, "project_create" | "ai_generate">) {
    const snapshot = await this.getEntitlementsByUserId(userId);

    if (feature === "share_access" && !snapshot.entitlements.shareEnabled) {
      throw new BillingLimitError("SHARE_DISABLED", "Your current plan does not include client sharing.");
    }

    if (feature === "export_pdf" && !snapshot.entitlements.exportPdfEnabled) {
      throw new BillingLimitError("EXPORT_PDF_DISABLED", "Your current plan does not include PDF export.");
    }

    return snapshot;
  },

  async createUpgradeRequest(
    targetPlan: SubscriptionPlan,
    input?: {
      note?: string;
      companyName?: string;
      contactName?: string;
      contactPhone?: string;
    }
  ) {
    const snapshot = await this.getSnapshot();
    const currentSubscriptionPlan = snapshot.subscriptionPlan ?? snapshot.plan;
    const currentEffectivePlan = snapshot.effectivePlan ?? snapshot.plan;

    if (currentSubscriptionPlan === targetPlan && currentEffectivePlan === targetPlan) {
      throw new BillingLimitError("PLAN_ALREADY_ACTIVE", "The selected plan is already active.");
    }

    if (BILLING_PLAN_ORDER.indexOf(targetPlan) < BILLING_PLAN_ORDER.indexOf(currentSubscriptionPlan)) {
      throw new BillingLimitError("INVALID_TARGET_PLAN", "The selected plan is not a valid upgrade target.");
    }

    const user = await requireUser();
    const request = await billingRepository.createUpgradeRequest(user.id, currentSubscriptionPlan, targetPlan, input);

    return {
      id: request.id,
      userId: request.user_id,
      companyName: request.company_name ?? null,
      contactName: request.contact_name ?? null,
      contactPhone: request.contact_phone ?? null,
      currentPlan: request.current_plan,
      targetPlan: request.target_plan,
      status: request.status,
      note: request.note,
      createdAt: request.created_at
    };
  },

  async listUpgradeRequests() {
    await requireAdminUser();
    const rows = await billingRepository.listUpgradeRequests();

    return rows.map((row) => {
      const plan = row.plan_type === "pro" ? "pro" : "free";
      const lifecycleStatus = resolveLifecycleStatus(plan, row.plan_status, row.plan_expires_at ?? null);

      return {
        id: row.id,
        userId: row.user_id,
        email: "email" in row && typeof row.email === "string" ? row.email : "",
        plan,
        effectivePlan: getEffectivePlan(plan, lifecycleStatus),
        lifecycleStatus,
        expiresAt: row.plan_expires_at ?? null,
        companyName: row.company_name ?? null,
        contactName: row.contact_name ?? null,
        contactPhone: row.contact_phone ?? null,
        currentPlan: row.current_plan,
        targetPlan: row.target_plan,
        status: row.status,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
  },

  async createBillingOrder(
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
    const snapshot = await this.getSnapshot();
    const currentSubscriptionPlan = snapshot.subscriptionPlan ?? snapshot.plan;
    const currentEffectivePlan = snapshot.effectivePlan ?? snapshot.plan;

    if (currentSubscriptionPlan === targetPlan && currentEffectivePlan === targetPlan) {
      throw new BillingLimitError("PLAN_ALREADY_ACTIVE", "The selected plan is already active.");
    }

    const user = await requireUser();
    const order = await billingRepository.createBillingOrder(user.id, currentSubscriptionPlan, targetPlan, input);

    return mapBillingOrder(order);
  },

  async listBillingOrders() {
    await requireAdminUser();
    const rows = await billingRepository.listBillingOrders();

    return rows.map(mapBillingOrder);
  },

  async cancelUpgradeRequest() {
    const user = await requireUser();

    let request;

    try {
      request = await billingRepository.cancelLatestUpgradeRequest(user.id);
    } catch (error) {
      if (error instanceof Error && error.message === "No pending upgrade request found.") {
        throw new BillingLimitError("NO_PENDING_UPGRADE_REQUEST", error.message);
      }

      throw error;
    }

    return {
      id: request.id,
      userId: request.user_id,
      companyName: request.company_name ?? null,
      contactName: request.contact_name ?? null,
      contactPhone: request.contact_phone ?? null,
      currentPlan: request.current_plan,
      targetPlan: request.target_plan,
      status: request.status,
      note: request.note,
      createdAt: request.created_at,
      updatedAt: request.updated_at
    };
  },

  async adminChangeUserPlan(userId: string, targetPlan: SubscriptionPlan) {
    await requireAdminUser();

    if (!BILLING_PLAN_ORDER.includes(targetPlan)) {
      throw new BillingLimitError("INVALID_TARGET_PLAN", "The selected plan is invalid.");
    }

    const profile = await billingRepository.updateUserPlan(userId, targetPlan);

    return {
      userId: profile.id,
      email: profile.email,
      plan: profile.plan_type,
      updatedAt: profile.updated_at
    };
  },

  async adminUpdateLifecycle(
    userId: string,
    input: {
      plan?: SubscriptionPlan;
      lifecycleStatus?: BillingLifecycleStatus;
      expiresAt?: string | null;
    }
  ) {
    await requireAdminUser();

    if (input.plan && !BILLING_PLAN_ORDER.includes(input.plan)) {
      throw new BillingLimitError("INVALID_TARGET_PLAN", "The selected plan is invalid.");
    }

    if (input.lifecycleStatus && !isValidLifecycleStatus(input.lifecycleStatus)) {
      throw new BillingLimitError("INVALID_LIFECYCLE_STATUS", "The selected lifecycle status is invalid.");
    }

    const profile = await billingRepository.updateUserPlanLifecycle(userId, {
      plan: input.plan,
      planStatus: input.lifecycleStatus,
      planExpiresAt: input.expiresAt ?? null
    });
    const lifecycleStatus = resolveLifecycleStatus(profile.plan_type, profile.plan_status, profile.plan_expires_at);

    return {
      userId: profile.id,
      email: profile.email,
      plan: profile.plan_type,
      effectivePlan: getEffectivePlan(profile.plan_type, lifecycleStatus),
      lifecycleStatus,
      expiresAt: profile.plan_expires_at ?? null,
      updatedAt: profile.updated_at
    };
  },

  async reviewUpgradeRequest(requestId: string, status: UpgradeRequestStatus) {
    await requireAdminUser();

    if (!["approved", "rejected", "canceled"].includes(status)) {
      throw new BillingLimitError("INVALID_REVIEW_STATUS", "Invalid review status.");
    }

    const updatedRequest = await billingRepository.updateUpgradeRequestStatus(requestId, status);

    if (status === "approved" && updatedRequest.user_id) {
      await billingRepository.updateUserPlanLifecycle(updatedRequest.user_id, {
        plan: updatedRequest.target_plan,
        planStatus: updatedRequest.target_plan === "pro" ? "active" : "inactive",
        planExpiresAt: null
      });
    }

    return {
      id: updatedRequest.id,
      userId: updatedRequest.user_id,
      companyName: updatedRequest.company_name ?? null,
      contactName: updatedRequest.contact_name ?? null,
      contactPhone: updatedRequest.contact_phone ?? null,
      currentPlan: updatedRequest.current_plan,
      targetPlan: updatedRequest.target_plan,
      status: updatedRequest.status,
      note: updatedRequest.note,
      createdAt: updatedRequest.created_at,
      updatedAt: updatedRequest.updated_at
    };
  },
  async reviewBillingOrder(
    orderId: string,
    input: {
      status: BillingOrderStatus;
      reviewedNote?: string;
    }
  ) {
    await requireAdminUser();

    if (!["submitted", "confirmed", "rejected", "canceled", "pending_payment"].includes(input.status)) {
      throw new BillingLimitError("INVALID_REVIEW_STATUS", "Invalid order review status.");
    }

    const order = await billingRepository.updateBillingOrderStatus(orderId, input);

    if (order.status === "confirmed" && order.user_id) {
      await billingRepository.updateUserPlanLifecycle(order.user_id, {
        plan: order.target_plan,
        planStatus: order.target_plan === "pro" ? "active" : "inactive",
        planExpiresAt: null
      });
    }

    return mapBillingOrder(order);
  }
};
