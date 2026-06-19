import type { ProjectDetail } from "@/shared/types/project";

export function mockProjectDetail(id: string): ProjectDetail {
  return {
    project: {
      id,
      title: "教育品牌官网升级方案",
      clientName: "清林教育",
      clientCompany: "清林教育科技有限公司",
      projectType: "website",
      industry: "教育培训",
      contactName: "周老师",
      contactPhone: "138-0000-2568",
      summary:
        "为清林教育搭建一套兼顾品牌展示、课程转化与线索收集的官网系统，帮助客户统一线上形象，并提升招生咨询的承接效率。",
      background:
        "现有官网结构老旧、课程信息分散，移动端体验不稳定，家长和学员在浏览课程内容、师资介绍和试听预约时容易流失。",
      goal:
        "建立一套内容结构清晰、品牌感稳定、便于后续运营维护的官网，重点突出课程体系、教学成果与预约咨询入口。",
      scope:
        "包含信息架构梳理、视觉设计、响应式前端开发、CMS 内容配置、基础 SEO 设置、测试上线支持与一次后台使用培训。",
      rawRequirement:
        "客户希望重新做一个教育品牌官网，用于课程展示、案例内容沉淀和线上获客，希望页面更现代，同时方便后续自己维护内容。",
      duration: "预计 4 周完成，分为方案确认、视觉设计、开发联调、测试上线 4 个阶段。",
      deliveryNote:
        "交付高保真设计稿、前端源码、CMS 字段配置说明、测试清单、上线支持文档以及一次交付培训。",
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
        description: "梳理页面层级、内容路径、用户转化节点与首批上线信息结构。",
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
        description: "完成首页、课程页、案例页、关于我们、联系页等核心页面的高保真视觉方案。",
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
        name: "响应式前端开发",
        description: "实现桌面端与移动端页面开发、表单交互、动效细节与内容录入配合。",
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
        description: "完成后台字段配置、内容录入支持、测试修正、正式部署与交付培训。",
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
