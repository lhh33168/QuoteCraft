import { WorkspacePageClient } from "@/features/workspace/components/workspace-page-client";
import { projectService } from "@/server/services/project-service";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { HydrationProvider } from "@/shared/providers/hydration-provider";
import { queryKeys } from "@/shared/lib/query-keys";

export default async function WorkspaceRoute() {
  const projects = await projectService.listProjects();
  const queryClient = new QueryClient();

  queryClient.setQueryData(queryKeys.projects, projects);

  return (
    <HydrationProvider state={dehydrate(queryClient)}>
      <WorkspacePageClient initialProjects={projects} />
    </HydrationProvider>
  );
}
