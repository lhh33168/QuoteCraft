import { NextResponse } from "next/server";
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("api.projects.shareFailed")
      },
      { status: 500 }
    );
  }
}
