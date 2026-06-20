import { BillingLimitError } from "@/server/billing/billing-service";
import { ProjectPrintPage } from "@/features/project-documents/components/project-print-page";
import { projectService } from "@/server/services/project-service";
import { formatMessage } from "@/shared/i18n/format-message";
import { getMessage } from "@/shared/i18n/get-message";
import { messages } from "@/shared/i18n/messages";

type ProjectPrintRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPrintRoute({ params }: ProjectPrintRouteProps) {
  const { id } = await params;
  const t = (path: string, values?: Record<string, string | number>) =>
    formatMessage(getMessage(messages["zh-CN"], path), values);

  try {
    const detail = await projectService.assertCurrentUserCanExportProject(id);

    return <ProjectPrintPage detail={detail} />;
  } catch (error) {
    const message =
      error instanceof BillingLimitError
        ? error.code === "EXPORT_PDF_DISABLED"
          ? t("api.billing.exportPdfDisabled")
          : error.message
        : error instanceof Error
          ? error.message
          : t("print.exportDisabledDescription");

    return <ProjectPrintPage detail={null} errorMessage={message} />;
  }
}
