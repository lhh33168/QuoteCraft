import { NextResponse } from "next/server";
import { BillingLimitError } from "@/server/billing/billing-service";
import { projectService } from "@/server/services/project-service";
import { createRequestTranslator } from "@/shared/i18n/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { t } = createRequestTranslator(request);

  try {
    const { id } = await params;
    const result = await projectService.ensureProjectShareToken(id);

    return NextResponse.redirect(new URL(result.shareUrl, request.url));
  } catch (error) {
    const message =
      error instanceof BillingLimitError
        ? error.code === "SHARE_DISABLED"
          ? t("api.billing.shareDisabled")
          : error.message
        : error instanceof Error
          ? error.message
          : t("api.projects.shareFailed");

    return NextResponse.redirect(new URL(`/workspace?shareError=${encodeURIComponent(message)}`, request.url));
  }
}
