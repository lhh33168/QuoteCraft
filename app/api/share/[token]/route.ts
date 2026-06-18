import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";

type RouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { token } = await params;

  const detail = await projectService.getSharedProject(token);

  return NextResponse.json({
    token,
    ...detail
  });
}
