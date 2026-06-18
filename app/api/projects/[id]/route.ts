import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";
import type { ProjectDetail } from "@/shared/types/project";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;

  const detail = await projectService.getProjectDetail(id);

  return NextResponse.json(detail);
}

export async function PUT(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const payload = (await request.json()) as ProjectDetail;
  const detail = await projectService.updateProject(id, payload);

  return NextResponse.json(detail);
}

export async function DELETE(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const result = await projectService.deleteProject(id);

  return NextResponse.json(result);
}
