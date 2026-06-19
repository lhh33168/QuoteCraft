import type { ProjectDetail } from "@/shared/types/project";

export function createEmptyProjectDraft(): ProjectDetail {
  return {
    project: {
      id: "new-project",
      title: "",
      clientName: "",
      clientCompany: "",
      projectType: "website",
      industry: "",
      contactName: "",
      contactPhone: "",
      summary: "",
      background: "",
      goal: "",
      scope: "",
      rawRequirement: "",
      duration: "",
      deliveryNote: "",
      remark: "",
      templateType: "full",
      totalPrice: "0.00",
      status: "draft",
      shareToken: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    quoteItems: [
      {
        id: "item-1",
        name: "官网策划与信息架构",
        description: "梳理页面结构、内容路径与转化流程。",
        category: "design",
        unitPrice: 6000,
        quantity: 1,
        unit: "项",
        subtotal: 6000,
        sortOrder: 1,
        isPreset: true
      }
    ]
  };
}
