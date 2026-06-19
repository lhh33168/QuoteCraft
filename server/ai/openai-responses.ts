import { env } from "@/server/config/env";

type OpenAiTextGenerationInput = {
  instructions: string;
  input: string;
  maxOutputTokens?: number;
};

type OpenAiTextGenerationResult = {
  text: string;
  provider: "openai";
  model: string;
  responseId: string | null;
};

export async function generateTextWithOpenAi({
  instructions,
  input,
  maxOutputTokens = 220
}: OpenAiTextGenerationInput): Promise<OpenAiTextGenerationResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = env.OPENAI_MODEL || "gpt-5.5";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      reasoning: {
        effort: "low"
      },
      instructions,
      input,
      max_output_tokens: maxOutputTokens
    })
  });

  const data = (await response.json()) as {
    id?: string;
    output_text?: string;
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI Responses API request failed.");
  }

  const text = typeof data.output_text === "string" ? data.output_text.trim() : "";

  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return {
    text,
    provider: "openai",
    model,
    responseId: data.id ?? null
  };
}
