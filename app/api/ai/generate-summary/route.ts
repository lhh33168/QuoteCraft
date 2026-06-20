import { NextResponse } from "next/server";
import { generateBusinessCopy } from "@/server/ai/generate-business-copy";
import { validateAiInput } from "@/server/ai/validate-ai-input";
import { logAiCall } from "@/server/ai/log-ai-call";
import { requireUser } from "@/server/auth/require-user";
import { BillingLimitError, billingService } from "@/server/billing/billing-service";
import { createRequestTranslator } from "@/shared/i18n/server";

export async function POST(request: Request) {
  const { t } = createRequestTranslator(request);
  const rawBody = (await request.json().catch(() => ({}))) as {
    projectType?: string;
    industry?: string;
    features?: string[];
    rawRequirement?: string;
    projectId?: string;
  };
  const body = validateAiInput(rawBody);
  const user = await requireUser().catch(() => null);

  try {
    await billingService.assertCanUse("ai_generate");
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return NextResponse.json(
        {
          error: error.code === "AI_LIMIT_REACHED" ? t("api.billing.aiLimitReached") : error.message,
          code: error.code
        },
        { status: 403 }
      );
    }

    throw error;
  }

  const result = await generateBusinessCopy("summary", body);

  await logAiCall({
    userId: user?.id ?? null,
    projectId: rawBody.projectId ?? null,
    action: "generate_summary",
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
