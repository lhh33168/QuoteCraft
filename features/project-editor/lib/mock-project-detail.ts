import type { ProjectDetail } from "@/shared/types/project";

export function mockProjectDetail(id: string): ProjectDetail {
  return {
    project: {
      id,
      title: "教育品牌官网升级",
      clientName: "清林教育",
      clientCompany: "清林教育科技有限公司",
      projectType: "website",
      industry: "education",
      contactName: "周老师",
      contactPhone: "138-0000-2568",
      summary:
        "本项目旨在为清林教育搭建一套兼顾品牌展示、课程转化与线索收集的官网系统，帮助客户统一线上形象并提升招生咨询效率。",
      background: "现有官网结构老旧，课程信息分散，缺少移动端一致体验。",
      goal: "建立稳定、易维护的品牌官网，突出课程体系、案例展示与咨询转化入口。",
      scope: "信息架构梳理、页面视觉设计、前端开发、CMS 配置、测试上线支持。",
      rawRequirement: "客户需要一个教育品牌官网，用于课程展示和线索收集。",
      duration: "预计 4 周完成，分为方案确认、设计、开发、测试上线 4 个阶段。",
      deliveryNote: "交付设计稿、前端代码、后台部署文档、测试清单和一次培训说明。",
      remark: "",
      templateType: "full",
      totalPrice: "38000.00",
      status: "generated",
      shareToken: `share-${id}`,
      updatedAt: "2026-06-18T10:00:00Z",
      createdAt: "2026-06-18T10:00:00Z"
    },
    quoteItems: [
      {
        id: "item-1",
        name: "官网策划与信息架构",
        description: "梳理页面结构、内容路径与转化节点。",
        category: "design",
        unitPrice: 6000,
        quantity: 1,
        unit: "项",
        subtotal: 6000,
        sortOrder: 1,
        isPreset: true
      },
      {
        id: "item-2",
        name: "UI 视觉设计",
        description: "首页、课程页、案例页、关于页与联系页高保真视觉设计。",
        category: "design",
        unitPrice: 8000,
        quantity: 1,
        unit: "项",
        subtotal: 8000,
        sortOrder: 2,
        isPreset: true
      },
      {
        id: "item-3",
        name: "前端开发",
        description: "响应式页面开发、动画细节、表单交互与内容录入支持。",
        category: "frontend",
        unitPrice: 12000,
        quantity: 1,
        unit: "项",
        subtotal: 12000,
        sortOrder: 3,
        isPreset: true
      },
      {
        id: "item-4",
        name: "CMS 配置与上线支持",
        description: "后台字段配置、部署上线、测试修正和一次交付培训。",
        category: "ops",
        unitPrice: 6000,
        quantity: 2,
        unit: "阶段",
        subtotal: 12000,
        sortOrder: 4,
        isPreset: true
      }
    ]
  };
}
