import { ProjectPrintPage } from "@/features/project-documents/components/project-print-page";
import { projectService } from "@/server/services/project-service";

type ProjectPrintRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPrintRoute({ params }: ProjectPrintRouteProps) {
  const { id } = await params;
  const detail = await projectService.getProjectDetail(id);

  return <ProjectPrintPage detail={detail} />;
}
