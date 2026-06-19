import type { ProjectDetail } from "@/shared/types/project";

export function buildProjectDetailPayload(detail: ProjectDetail): ProjectDetail {
  return {
    project: {
      ...detail.project
    },
    quoteItems: detail.quoteItems.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
      subtotal: Number(item.unitPrice || 0) * Number(item.quantity || 0)
    }))
  };
}
