import { NextResponse } from "next/server";
import { BillingLimitError } from "@/server/billing/billing-service";
import { exportProjectPdf } from "@/server/pdf/export-project-pdf";
import { projectService } from "@/server/services/project-service";
import { createRequestTranslator } from "@/shared/i18n/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { t } = createRequestTranslator(request);
  const { id } = await params;

  try {
    const detail = await projectService.assertCurrentUserCanExportProject(id);
    const pdf = await exportProjectPdf(detail);

    return new NextResponse(Buffer.from(pdf.bytes), {
      status: 200,
      headers: {
        "Content-Type": pdf.contentType,
        "Content-Disposition": `attachment; filename="quotecraft-proposal.pdf"; filename*=UTF-8''${encodeURIComponent(pdf.fileName)}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const fallbackMessage = t("editorScreen.exportPdfFailed");
    const message =
      error instanceof BillingLimitError
        ? error.code === "EXPORT_PDF_DISABLED"
          ? t("api.billing.exportPdfDisabled")
          : error.message
        : error instanceof Error
          ? error.message.includes("中文字体")
            ? error.message
            : fallbackMessage
          : t("print.exportDisabledDescription");

    return NextResponse.json(
      {
        error: message
      },
      {
        status: error instanceof BillingLimitError ? 403 : 500
      }
    );
  }
}
