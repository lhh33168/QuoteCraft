import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";
import type { ProjectDetail } from "@/shared/types/project";

export async function GET() {
  const items = await projectService.listProjects();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ProjectDetail;
  const detail = await projectService.createProject(payload);

  return NextResponse.json(detail);
}
