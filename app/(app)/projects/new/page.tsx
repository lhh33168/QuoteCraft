import { ProjectEditorPage } from "@/features/project-editor/components/project-editor-page";
import { createEmptyProjectDraft } from "@/features/project-editor/lib/create-empty-project-draft";
import { createProjectDraftFromTemplate } from "@/features/project-editor/lib/create-project-draft-from-template";

type NewProjectPageProps = {
  searchParams: Promise<{
    template?: string;
  }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const { template } = await searchParams;
  const initialState =
    template === "education-site" ? createProjectDraftFromTemplate("project-education-site") : createEmptyProjectDraft();

  return <ProjectEditorPage mode="create" initialState={initialState} />;
}
