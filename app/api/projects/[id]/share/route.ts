import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const result = await projectService.ensureProjectShareToken(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "生成分享链接失败。"
      },
      { status: 500 }
    );
  }
}
