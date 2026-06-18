import { WorkspacePage } from "@/features/workspace/components/workspace-page";
import { projectService } from "@/server/services/project-service";

export default async function WorkspaceRoute() {
  const projects = await projectService.listProjects();

  return <WorkspacePage projects={projects} />;
}
