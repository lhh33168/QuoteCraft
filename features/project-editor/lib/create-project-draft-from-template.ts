import { mockProjectDetail } from "@/features/project-editor/lib/mock-project-detail";
import type { ProjectDetail } from "@/shared/types/project";

export function createProjectDraftFromTemplate(templateId: string): ProjectDetail {
  const template = mockProjectDetail(templateId);
  const now = new Date().toISOString();

  return {
    project: {
      ...template.project,
      id: "new-project",
      title: `${template.project.title} - 副本`,
      status: "draft",
      shareToken: null,
      updatedAt: now,
      createdAt: now
    },
    quoteItems: template.quoteItems.map((item, index) => ({
      ...item,
      id: `item-${index + 1}`,
      sortOrder: index + 1
    }))
  };
}
