"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProjectDetail } from "@/shared/types/project";
import { createProjectEditorStore } from "@/features/project-editor/store/project-editor-store";
import { ProjectEditorScreen } from "@/features/project-editor/components/project-editor-screen";
import { fetchProjectDetail } from "@/features/project-editor/lib/fetch-project-detail";
import { queryKeys } from "@/shared/lib/query-keys";

type ProjectEditorClientProps = {
  mode: "create" | "edit";
  initialState: ProjectDetail;
};

export function ProjectEditorClient({ mode, initialState }: ProjectEditorClientProps) {
  const storeRef = useRef<ReturnType<typeof createProjectEditorStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProjectEditorStore(initialState);
  }

  const detailQuery = useQuery({
    queryKey: queryKeys.project(initialState.project.id),
    queryFn: () => fetchProjectDetail(initialState.project.id),
    enabled: mode === "edit",
    initialData: initialState
  });

  useEffect(() => {
    if (mode !== "edit" || !detailQuery.data || !storeRef.current) {
      return;
    }

    const state = storeRef.current.getState();

    if (!state.dirty && !state.saving) {
      state.replaceDetail(detailQuery.data);
    }
  }, [detailQuery.data, mode]);

  return <ProjectEditorScreen mode={mode} store={storeRef.current} />;
}
