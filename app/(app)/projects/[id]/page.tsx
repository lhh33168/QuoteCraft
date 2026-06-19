import { ProjectEditorPage } from "@/features/project-editor/components/project-editor-page";
import { projectService } from "@/server/services/project-service";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { HydrationProvider } from "@/shared/providers/hydration-provider";
import { queryKeys } from "@/shared/lib/query-keys";

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  const detail = await projectService.getProjectDetail(id);
  const queryClient = new QueryClient();

  queryClient.setQueryData(queryKeys.project(id), detail);

  return (
    <HydrationProvider state={dehydrate(queryClient)}>
      <ProjectEditorPage mode="edit" initialState={detail} />
    </HydrationProvider>
  );
}
