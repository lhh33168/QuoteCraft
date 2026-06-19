import { NextResponse } from "next/server";
import { generateBusinessCopy } from "@/server/ai/generate-business-copy";
import { validateAiInput } from "@/server/ai/validate-ai-input";
import { logAiCall } from "@/server/ai/log-ai-call";
import { requireUser } from "@/server/auth/require-user";

export async function POST(request: Request) {
  const rawBody = (await request.json().catch(() => ({}))) as {
    projectType?: string;
    industry?: string;
    features?: string[];
    rawRequirement?: string;
    projectId?: string;
  };
  const body = validateAiInput(rawBody);
  const user = await requireUser().catch(() => null);

  const result = await generateBusinessCopy("scope", body);

  await logAiCall({
    userId: user?.id ?? null,
    projectId: rawBody.projectId ?? null,
    action: "generate_scope",
    inputSnapshot: body,
    outputText: result.text
  });

  return NextResponse.json({
    text: result.text,
    prompt: result.prompt,
    meta: {
      provider: result.provider,
      model: result.model ?? null
    }
  });
}
