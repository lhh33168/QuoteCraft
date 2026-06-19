import { ProjectEditorClient } from "@/features/project-editor/components/project-editor-client";
import type { ProjectDetail } from "@/shared/types/project";
import { AppShell } from "@/shared/ui/app-shell";

type ProjectEditorPageProps = {
  mode: "create" | "edit";
  initialState: ProjectDetail;
};

export function ProjectEditorPage({ mode, initialState }: ProjectEditorPageProps) {
  return (
    <AppShell
      title={mode === "create" ? "创建报价项目" : "编辑报价项目"}
      description="面向移动端的项目编辑工作区，基础信息、项目说明、报价项、AI 辅助和输出动作都在这里完成。"
    >
      <ProjectEditorClient initialState={initialState} mode={mode} />
    </AppShell>
  );
}
