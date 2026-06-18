"use client";

import { useRef } from "react";
import type { ProjectDetail } from "@/shared/types/project";
import { createProjectEditorStore } from "@/features/project-editor/store/project-editor-store";
import { ProjectEditorScreen } from "@/features/project-editor/components/project-editor-screen";

type ProjectEditorClientProps = {
  initialState: ProjectDetail;
};

export function ProjectEditorClient({ initialState }: ProjectEditorClientProps) {
  const storeRef = useRef<ReturnType<typeof createProjectEditorStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProjectEditorStore(initialState);
  }

  return <ProjectEditorScreen store={storeRef.current} />;
}
