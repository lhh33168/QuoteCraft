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

export function buildFallbackSummary(input: PromptInput) {
  const industry = input.industry || "目标行业";
  const featureLine = (input.features ?? []).slice(0, 4).join("、") || "核心功能模块";

  return `本项目将围绕${industry}场景下的品牌展示、业务转化与内容承载展开，重点覆盖${featureLine}等关键模块建设，帮助客户形成更专业、统一且可持续扩展的线上方案输出。`;
}

export function buildFallbackScope(input: PromptInput) {
  const featureLine = (input.features ?? []).slice(0, 5).join("、") || "页面规划、设计与开发";

  return `服务范围建议包括需求梳理、信息架构规划、${featureLine}、测试联调、上线支持与交付说明，确保本次报价覆盖核心交付内容且便于后续继续扩展。`;
}
