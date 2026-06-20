export type SubscriptionPlan = "free" | "pro";

export type UpgradeRequestStatus = "pending" | "approved" | "rejected" | "canceled";

export type BillingLifecycleStatus = "active" | "expired" | "inactive";

export type BillingOrderStatus = "pending_payment" | "submitted" | "confirmed" | "rejected" | "canceled";

export type BillingEntitlements = {
  projectLimit: number | null;
  aiMonthlyLimit: number | null;
  shareEnabled: boolean;
  exportPdfEnabled: boolean;
};

export type BillingUsage = {
  projectCount: number;
  projectLimit: number | null;
  projectRemaining: number | null;
  aiGeneratedThisMonth: number;
  aiMonthlyLimit: number | null;
  aiRemaining: number | null;
};

export type BillingUpgradeRequest = {
  id: string;
  userId?: string;
  email?: string;
  plan?: SubscriptionPlan;
  effectivePlan?: SubscriptionPlan;
  lifecycleStatus?: BillingLifecycleStatus;
  expiresAt?: string | null;
  companyName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  status: UpgradeRequestStatus;
  createdAt: string;
  updatedAt?: string;
  note: string | null;
};

export type BillingOrder = {
  id: string;
  userId?: string;
  email?: string;
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  status: BillingOrderStatus;
  amountLabel?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  payerName?: string | null;
  payerPhone?: string | null;
  note?: string | null;
  reviewedNote?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type BillingSnapshot = {
  email: string;
  plan: SubscriptionPlan;
  effectivePlan?: SubscriptionPlan;
  subscriptionPlan?: SubscriptionPlan;
  lifecycleStatus?: BillingLifecycleStatus;
  expiresAt?: string | null;
  isAdmin?: boolean;
  entitlements: BillingEntitlements;
  usage: BillingUsage;
  upgradeRequest: BillingUpgradeRequest | null;
  latestOrder?: BillingOrder | null;
  orders?: BillingOrder[];
  recommendedPlan: SubscriptionPlan | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminBillingResponse = {
  items: BillingUpgradeRequest[];
  orders?: BillingOrder[];
};
