import { ShareDocumentPage } from "@/features/share-document/components/share-document-page";
import { projectService } from "@/server/services/project-service";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const document = await projectService.getSharedProject(token);

  return <ShareDocumentPage document={{ ...document, token }} />;
}
