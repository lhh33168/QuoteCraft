import { WorkspacePageClient } from "@/features/workspace/components/workspace-page-client";
import { billingService } from "@/server/billing/billing-service";
import { projectService } from "@/server/services/project-service";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { HydrationProvider } from "@/shared/providers/hydration-provider";
import { queryKeys } from "@/shared/lib/query-keys";

export default async function WorkspaceRoute() {
  const [projects, billingSnapshot] = await Promise.all([projectService.listProjects(), billingService.getSnapshot()]);
  const queryClient = new QueryClient();

  queryClient.setQueryData(queryKeys.projects, projects);
  queryClient.setQueryData(queryKeys.billing, billingSnapshot);

  return (
    <HydrationProvider state={dehydrate(queryClient)}>
      <WorkspacePageClient initialBillingSnapshot={billingSnapshot} initialProjects={projects} />
    </HydrationProvider>
  );
}
