"use client";

import { useQuery } from "@tanstack/react-query";
import { WorkspacePage } from "@/features/workspace/components/workspace-page";
import { fetchProjects } from "@/features/workspace/lib/fetch-projects";
import { queryKeys } from "@/shared/lib/query-keys";
import type { Project } from "@/shared/types/project";

type WorkspacePageClientProps = {
  initialProjects: Project[];
};

export function WorkspacePageClient({ initialProjects }: WorkspacePageClientProps) {
  const { data } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
    initialData: initialProjects
  });

  return <WorkspacePage projects={data} />;
}
