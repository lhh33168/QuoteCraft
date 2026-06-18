type PromptInput = {
  projectType?: string;
  industry?: string;
  features?: string[];
  rawRequirement?: string;
};

export function buildSummaryPrompt(input: PromptInput) {
  return [
    "你是专业的售前顾问。",
    "请输出一段简洁、商务、克制的项目简介。",
    `项目类型：${input.projectType ?? "未提供"}`,
    `客户行业：${input.industry ?? "未提供"}`,
    `功能模块：${(input.features ?? []).join("、") || "未提供"}`,
    `原始需求：${input.rawRequirement ?? "未提供"}`
  ].join("\n");
}

export function buildScopePrompt(input: PromptInput) {
  return [
    "你是专业的售前顾问。",
    "请输出服务范围说明，不夸大承诺，不虚构未报价服务。",
    `项目类型：${input.projectType ?? "未提供"}`,
    `客户行业：${input.industry ?? "未提供"}`,
    `功能模块：${(input.features ?? []).join("、") || "未提供"}`,
    `原始需求：${input.rawRequirement ?? "未提供"}`
  ].join("\n");
}
