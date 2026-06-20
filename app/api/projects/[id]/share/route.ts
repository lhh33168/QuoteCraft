import { NextResponse } from "next/server";
import { BillingLimitError } from "@/server/billing/billing-service";
import { projectService } from "@/server/services/project-service";
import { createRequestTranslator } from "@/shared/i18n/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { t } = createRequestTranslator(request);

  try {
    const { id } = await params;
    const result = await projectService.ensureProjectShareToken(id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return NextResponse.json(
        {
          error: error.code === "SHARE_DISABLED" ? t("api.billing.shareDisabled") : error.message,
          code: error.code
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.projects.shareFailed")
      },
      { status: 500 }
    );
  }
}
