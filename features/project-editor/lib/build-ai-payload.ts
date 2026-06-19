import type { ProjectDetail } from "@/shared/types/project";

export function buildAiPayload(detail: ProjectDetail) {
  return {
    projectId: detail.project.id,
    projectType: detail.project.projectType,
    industry: detail.project.industry ?? "",
    features: detail.quoteItems.map((item) => item.name).filter(Boolean),
    rawRequirement: detail.project.rawRequirement ?? ""
  };
}
