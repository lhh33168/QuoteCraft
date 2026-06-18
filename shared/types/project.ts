export type ProjectStatus = "draft" | "generated" | "shared";
export type TemplateType = "simple" | "full";
export type ProjectType = "website" | "mini_program" | "admin_panel" | "custom";
export type QuoteCategory = "design" | "frontend" | "backend" | "testing" | "ops" | "other";

export type Project = {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string | null;
  projectType: ProjectType;
  industry: string | null;
  contactName: string | null;
  contactPhone: string | null;
  summary: string | null;
  background: string | null;
  goal: string | null;
  scope: string | null;
  rawRequirement: string | null;
  duration: string | null;
  deliveryNote: string | null;
  remark: string | null;
  templateType: TemplateType;
  totalPrice: string;
  status: ProjectStatus;
  shareToken: string | null;
  updatedAt: string;
  createdAt: string;
};

export type QuoteItem = {
  id: string;
  name: string;
  description: string | null;
  category: QuoteCategory;
  unitPrice: number;
  quantity: number;
  unit: string | null;
  subtotal: number;
  sortOrder: number;
  isPreset: boolean;
};

export type ProjectDetail = {
  project: Project;
  quoteItems: QuoteItem[];
};
