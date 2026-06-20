import { NextResponse } from "next/server";
import { BillingLimitError, billingService } from "@/server/billing/billing-service";
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
    await billingService.assertCanUse("project_create");

    const { id } = await params;
    const source = await projectService.getProjectDetail(id);

    return NextResponse.json({
      project: {
        ...source.project,
        id: `${id}-copy`,
        title: `${source.project.title}(副本)`,
        status: "draft"
      },
      quoteItems: source.quoteItems.map((item) => ({
        ...item,
        id: `${item.id}-copy`
      }))
    });
  } catch (error) {
    if (error instanceof BillingLimitError) {
      return NextResponse.json(
        {
          error: error.code === "PROJECT_LIMIT_REACHED" ? t("api.billing.projectLimitReached") : error.message,
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
