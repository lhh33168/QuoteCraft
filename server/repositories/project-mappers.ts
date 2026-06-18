import type { Project, ProjectDetail, QuoteItem } from "@/shared/types/project";

type ProjectRow = {
  id: string;
  title: string;
  client_name: string;
  client_company: string | null;
  project_type: string;
  industry: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  summary: string | null;
  background: string | null;
  goal: string | null;
  scope: string | null;
  raw_requirement: string | null;
  duration: string | null;
  delivery_note: string | null;
  remark: string | null;
  template_type: string;
  total_price: number | string;
  status: string;
  share_token: string | null;
  updated_at: string;
  created_at: string;
};

type QuoteItemRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unit_price: number | string;
  quantity: number;
  unit: string | null;
  subtotal: number | string;
  sort_order: number;
  is_preset: boolean;
};

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    clientCompany: row.client_company,
    projectType: normalizeProjectType(row.project_type),
    industry: row.industry,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    summary: row.summary,
    background: row.background,
    goal: row.goal,
    scope: row.scope,
    rawRequirement: row.raw_requirement,
    duration: row.duration,
    deliveryNote: row.delivery_note,
    remark: row.remark,
    templateType: normalizeTemplateType(row.template_type),
    totalPrice: String(row.total_price),
    status: normalizeStatus(row.status),
    shareToken: row.share_token,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

export function mapQuoteItemRow(row: QuoteItemRow): QuoteItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: normalizeCategory(row.category),
    unitPrice: Number(row.unit_price),
    quantity: row.quantity,
    unit: row.unit,
    subtotal: Number(row.subtotal),
    sortOrder: row.sort_order,
    isPreset: row.is_preset
  };
}

export function buildProjectDetail(projectRow: ProjectRow, quoteItemRows: QuoteItemRow[]): ProjectDetail {
  return {
    project: mapProjectRow(projectRow),
    quoteItems: quoteItemRows.map(mapQuoteItemRow)
  };
}

function normalizeProjectType(value: string): Project["projectType"] {
  if (value === "website" || value === "mini_program" || value === "admin_panel") {
    return value;
  }

  return "custom";
}

function normalizeTemplateType(value: string): Project["templateType"] {
  return value === "simple" ? "simple" : "full";
}

function normalizeStatus(value: string): Project["status"] {
  if (value === "draft" || value === "generated" || value === "shared") {
    return value;
  }

  return "draft";
}

function normalizeCategory(value: string): QuoteItem["category"] {
  if (
    value === "design" ||
    value === "frontend" ||
    value === "backend" ||
    value === "testing" ||
    value === "ops"
  ) {
    return value;
  }

  return "other";
}
