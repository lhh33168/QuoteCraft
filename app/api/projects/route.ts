import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";
import type { ProjectDetail } from "@/shared/types/project";

export async function GET() {
  try {
    const items = await projectService.listProjects();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "读取项目列表失败。"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProjectDetail;
    const detail = await projectService.createProject(payload);

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "创建项目失败。"
      },
      { status: 500 }
    );
  }
}
