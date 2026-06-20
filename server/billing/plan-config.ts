import type { BillingEntitlements, SubscriptionPlan } from "@/shared/types/billing";

export const BILLING_PLAN_ORDER: SubscriptionPlan[] = ["free", "pro"];

export const BILLING_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "free",
  pro: "pro"
};

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, BillingEntitlements> = {
  free: {
    projectLimit: 3,
    aiMonthlyLimit: 10,
    shareEnabled: true,
    exportPdfEnabled: true
  },
  pro: {
    projectLimit: null,
    aiMonthlyLimit: null,
    shareEnabled: true,
    exportPdfEnabled: true
  }
};

export function getPlanEntitlements(plan: SubscriptionPlan): BillingEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}
