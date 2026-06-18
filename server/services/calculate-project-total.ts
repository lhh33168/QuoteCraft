import type { QuoteItem } from "@/shared/types/project";

export function calculateProjectTotal(quoteItems: QuoteItem[]) {
  return quoteItems
    .reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0)
    .toFixed(2);
}
