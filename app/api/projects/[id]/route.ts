import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";
import { createRequestTranslator } from "@/shared/i18n/server";
import type { ProjectDetail } from "@/shared/types/project";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { t } = createRequestTranslator(request);

  try {
    const { id } = await params;
    const detail = await projectService.getProjectDetail(id);

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.projects.detailFailed")
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  const { t } = createRequestTranslator(request);

  try {
    const { id } = await params;
    const payload = (await request.json()) as ProjectDetail;
    const detail = await projectService.updateProject(id, payload);

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.projects.updateFailed")
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { t } = createRequestTranslator(request);

  try {
    const { id } = await params;
    const result = await projectService.deleteProject(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.projects.deleteFailed")
      },
      { status: 500 }
    );
  }
}
