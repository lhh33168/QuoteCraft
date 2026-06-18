import { NextResponse } from "next/server";
import { projectService } from "@/server/services/project-service";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const source = await projectService.getProjectDetail(id);

  return NextResponse.json({
    project: {
      ...source.project,
      id: `${id}-copy`,
      title: `${source.project.title}（复制）`,
      status: "draft"
    },
    quoteItems: source.quoteItems.map((item) => ({
      ...item,
      id: `${item.id}-copy`
    }))
  });
}
