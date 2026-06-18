import { ProjectEditorPage } from "@/features/project-editor/components/project-editor-page";
import { projectService } from "@/server/services/project-service";

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  const detail = await projectService.getProjectDetail(id);

  return <ProjectEditorPage mode="edit" initialState={detail} />;
}
