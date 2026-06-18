import type { ProjectDetail } from "@/shared/types/project";
import { AppShell } from "@/shared/ui/app-shell";
import { ProjectEditorClient } from "@/features/project-editor/components/project-editor-client";

type ProjectEditorPageProps = {
  mode: "create" | "edit";
  initialState: ProjectDetail;
};

export function ProjectEditorPage({ mode, initialState }: ProjectEditorPageProps) {
  return (
    <AppShell
      title={mode === "create" ? "创建报价项目" : "编辑报价项目"}
      description="移动端优先编辑器骨架：基础信息、项目说明、报价项、AI 辅助与分享输出都从这里进入。"
    >
      <ProjectEditorClient initialState={initialState} />
    </AppShell>
  );
}
