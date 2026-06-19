import { buildFallbackScope, buildFallbackSummary, buildScopePrompt, buildSummaryPrompt } from "@/server/ai/prompt-builders";
import { generateTextWithOpenAi } from "@/server/ai/openai-responses";

type CopyTarget = "summary" | "scope";

export type GenerateBusinessCopyInput = {
  projectType?: string;
  industry?: string;
  features?: string[];
  rawRequirement?: string;
};

export type GenerateBusinessCopyResult = {
  text: string;
  provider: "fallback" | "openai";
  model?: string;
  prompt: string;
};

export async function generateBusinessCopy(
  target: CopyTarget,
  input: GenerateBusinessCopyInput
): Promise<GenerateBusinessCopyResult> {
  const prompt = target === "summary" ? buildSummaryPrompt(input) : buildScopePrompt(input);

  try {
    const result = await generateTextWithOpenAi({
      instructions:
        target === "summary"
          ? "你是专业的售前顾问，请生成一段中文项目简介。要求专业、商务、克制，不夸大承诺，控制在120到220字。"
          : "你是专业的售前顾问，请生成一段中文服务范围说明。要求覆盖核心交付内容，不夸大承诺，不虚构未报价服务，控制在120到220字。",
      input: prompt,
      maxOutputTokens: 220
    });

    return {
      text: result.text,
      provider: "openai",
      model: result.model,
      prompt
    };
  } catch {
    return {
      text: target === "summary" ? buildFallbackSummary(input) : buildFallbackScope(input),
      provider: "fallback",
      prompt
    };
  }
}
