import { WorkspacePageClient } from "@/features/workspace/components/workspace-page-client";
import { billingService } from "@/server/billing/billing-service";
import { projectService } from "@/server/services/project-service";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { HydrationProvider } from "@/shared/providers/hydration-provider";
import { queryKeys } from "@/shared/lib/query-keys";

export default async function WorkspaceRoute() {
  const projects = await projectService.listProjects();
  const queryClient = new QueryClient();
  let billingSnapshot = null;
  let initialBillingError: string | null = null;

  try {
    billingSnapshot = await billingService.getSnapshot();
  } catch (error) {
    initialBillingError = error instanceof Error ? error.message : "Billing snapshot failed to load.";
  }

  queryClient.setQueryData(queryKeys.projects, projects);

  if (billingSnapshot) {
    queryClient.setQueryData(queryKeys.billing, billingSnapshot);
  }

  return (
    <HydrationProvider state={dehydrate(queryClient)}>
      <WorkspacePageClient
        initialBillingError={initialBillingError}
        initialBillingSnapshot={billingSnapshot}
        initialProjects={projects}
      />
    </HydrationProvider>
  );
}
