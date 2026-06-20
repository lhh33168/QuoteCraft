"use client";

import { ProjectEditorClient } from "@/features/project-editor/components/project-editor-client";
import { useI18n } from "@/shared/i18n/i18n-provider";
import type { ProjectDetail } from "@/shared/types/project";
import { AppShell } from "@/shared/ui/app-shell";

type ProjectEditorPageProps = {
  mode: "create" | "edit";
  initialState: ProjectDetail;
};

export function ProjectEditorPage({ mode, initialState }: ProjectEditorPageProps) {
  const { t } = useI18n();

  return (
    <AppShell
      backHref="/workspace"
      backLabel={t("editor.backToWorkspace")}
      eyebrow={mode === "create" ? t("editor.createEyebrow") : t("editor.editEyebrow")}
      title={mode === "create" ? t("editor.createTitle") : t("editor.editTitle")}
      description={t("editor.description")}
      mobileBottomBarSpacing="comfortable"
    >
      <ProjectEditorClient initialState={initialState} mode={mode} />
    </AppShell>
  );
}
