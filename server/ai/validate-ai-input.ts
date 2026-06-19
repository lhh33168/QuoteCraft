import type { GenerateBusinessCopyInput } from "@/server/ai/generate-business-copy";

export function validateAiInput(input: GenerateBusinessCopyInput) {
  return {
    projectType: truncate(input.projectType, 60),
    industry: truncate(input.industry, 80),
    features: (input.features ?? []).map((feature) => truncate(feature, 60)).filter(Boolean).slice(0, 12),
    rawRequirement: truncate(input.rawRequirement, 2000)
  };
}

function truncate(value: string | undefined, maxLength: number) {
  if (!value) {
    return "";
  }

  return value.trim().slice(0, maxLength);
}
