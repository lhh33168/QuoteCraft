import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const result = await projectService.ensureProjectShareToken(id);

    return NextResponse.redirect(new URL(result.shareUrl, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "打开客户页失败。";
    return NextResponse.redirect(new URL(`/workspace?shareError=${encodeURIComponent(message)}`, request.url));
  }
}
