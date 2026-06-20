import { NextResponse } from "next/server";
import { BillingLimitError, billingService } from "@/server/billing/billing-service";
import { projectService } from "@/server/services/project-service";
import { createRequestTranslator } from "@/shared/i18n/server";
import type { ProjectDetail } from "@/shared/types/project";

export async function GET(request: Request) {
  const { t } = createRequestTranslator(request);

  try {
    const items = await projectService.listProjects();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.projects.listFailed")
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { t } = createRequestTranslator(request);

  try {
    await billingService.assertCanUse("project_create");
    const payload = (await request.json()) as ProjectDetail;
    const detail = await projectService.createProject(payload);

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof BillingLimitError) {
      const message =
        error.code === "PROJECT_LIMIT_REACHED" ? t("api.billing.projectLimitReached") : error.message;

      return NextResponse.json(
        {
          error: message,
          code: error.code
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.projects.createFailed")
      },
      { status: 500 }
    );
  }
}
