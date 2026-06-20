import type { BillingSnapshot } from "@/shared/types/billing";

export async function fetchBillingSnapshot(): Promise<BillingSnapshot> {
  const response = await fetch("/api/billing", {
    credentials: "include",
    cache: "no-store"
  });

  const data = (await response.json()) as BillingSnapshot & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load billing data.");
  }

  return data;
}
