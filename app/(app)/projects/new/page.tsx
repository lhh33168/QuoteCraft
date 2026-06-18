import { ProjectEditorPage } from "@/features/project-editor/components/project-editor-page";
import { createEmptyProjectDraft } from "@/features/project-editor/lib/create-empty-project-draft";

export default function NewProjectPage() {
  return <ProjectEditorPage mode="create" initialState={createEmptyProjectDraft()} />;
}
