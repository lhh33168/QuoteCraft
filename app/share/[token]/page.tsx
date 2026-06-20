import { ShareDocumentPage } from "@/features/share-document/components/share-document-page";
import { getOptionalUser } from "@/server/auth/get-optional-user";
import { projectService } from "@/server/services/project-service";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    print?: string;
    autoprint?: string;
  }>;
};

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const { token } = await params;
  const { print, autoprint } = await searchParams;
  const [{ detail, billingAccess }, user] = await Promise.all([projectService.getSharedProjectWithAccess(token), getOptionalUser()]);

  return (
    <ShareDocumentPage
      autoPrint={autoprint === "1"}
      document={{ ...detail, token }}
      exportPdfEnabled={billingAccess.entitlements.exportPdfEnabled}
      isLoggedIn={Boolean(user)}
      isPrintMode={print === "1"}
    />
  );
}
