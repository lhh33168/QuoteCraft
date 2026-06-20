import type { AdminBillingResponse } from "@/shared/types/billing";

export async function fetchAdminUpgradeRequests(): Promise<AdminBillingResponse> {
  const response = await fetch("/api/admin/billing", {
    credentials: "include",
    cache: "no-store"
  });

  const data = (await response.json()) as AdminBillingResponse & {
    error?: string;
  };

  if (!response.ok || !data.items) {
    throw new Error(data.error ?? "Failed to load admin billing requests.");
  }

  return data;
}
