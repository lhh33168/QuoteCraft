"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { downloadFileFromResponse } from "@/shared/lib/download-file";
import { formatMoney } from "@/shared/lib/format-money";
import type { ProjectDetail, ProjectType } from "@/shared/types/project";
import { PageBackButton } from "@/shared/ui/page-back-button";

type ProjectPrintPageProps = {
  detail: ProjectDetail | null;
  errorMessage?: string | null;
};

function renderParagraph(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export function ProjectPrintPage({ detail, errorMessage = null }: ProjectPrintPageProps) {
  const { t } = useI18n();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  if (!detail) {
    return (
      <main className="app-safe-bottom min-h-screen bg-[#f5f1e8] print:bg-white">
        <div className="app-safe-top app-top-bar app-top-bar-compact sticky top-0 z-30 print:hidden">
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 py-3 sm:grid-cols-[48px_minmax(0,1fr)_48px]">
              <div className="shrink-0">
                <PageBackButton fallbackHref={"/workspace" as Route} label={t("print.backToEditor")} />
              </div>
              <div className="min-w-0 text-center">
                <p className="truncate text-[16px] font-semibold text-ink sm:text-[18px]">{t("print.title")}</p>
                <p className="mt-0.5 truncate text-[11px] tracking-[0.18em] text-muted">{t("print.eyebrow")}</p>
              </div>
              <div aria-hidden="true" className="h-11 w-11 sm:h-12 sm:w-12" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-3 pb-8 pt-5 sm:px-6">
          <section className="rounded-[28px] border border-amber-200 bg-amber-50/92 p-6 text-sm leading-7 text-amber-900 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{t("print.exportDisabledTitle")}</p>
            <p className="mt-3 font-semibold text-ink">{errorMessage ?? t("print.exportDisabledDescription")}</p>
            <div className="mt-5">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-amber-700"
                href="/settings/billing"
              >
                {t("editorScreen.limitUpgradeAction")}
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { project, quoteItems } = detail;

  const projectTypeLabelMap: Record<ProjectType, string> = {
    website: t("projectCard.website"),
    mini_program: t("projectCard.miniProgram"),
    admin_panel: t("projectCard.adminPanel"),
    custom: t("projectCard.custom")
  };

  async function handleDownloadPdf() {
    setIsDownloading(true);
    setDownloadMessage(null);

    try {
      const response = await fetch(`/api/projects/${project.id}/export-pdf`, {
        method: "GET"
      });
      const result = await downloadFileFromResponse(response, "QuoteCraft-Proposal.pdf", {
        preferShare: true,
        shareTitle: project.title || "QuoteCraft Proposal PDF"
      });
      setDownloadMessage(result.mode === "native-share" ? t("share.exportNativeShareFinishedMessage") : t("share.exportFinishedMessage"));
    } catch (error) {
      setDownloadMessage(error instanceof Error ? error.message : t("share.exportFailedMessage"));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="app-safe-bottom min-h-screen bg-[#f5f1e8] print:bg-white">
      <div className="app-safe-top app-top-bar app-top-bar-compact sticky top-0 z-30 print:hidden">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 py-3 sm:grid-cols-[48px_minmax(0,1fr)_48px]">
            <div className="shrink-0">
              <PageBackButton fallbackHref={`/projects/${project.id}` as Route} label={t("print.backToEditor")} />
            </div>
            <div className="min-w-0 text-center">
              <p className="truncate text-[16px] font-semibold text-ink sm:text-[18px]">{t("print.title")}</p>
              <p className="mt-0.5 truncate text-[11px] tracking-[0.18em] text-muted">{t("print.eyebrow")}</p>
            </div>
            <div aria-hidden="true" className="h-11 w-11 sm:h-12 sm:w-12" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 print:max-w-none print:px-0 print:py-0">
        <section className="mb-5 rounded-[24px] border border-sky-100 bg-sky-50/92 p-4 text-sm leading-7 text-sky-900 print:hidden sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{t("print.guideEyebrow")}</p>
              <p className="mt-2 font-semibold text-ink">{t("print.guideTitle")}</p>
              {downloadMessage ? <p className="mt-2 text-sm leading-6 text-sky-900">{downloadMessage}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-pine px-5 text-sm font-semibold text-white"
                disabled={isDownloading}
                onClick={() => {
                  void handleDownloadPdf();
                }}
                type="button"
              >
                {isDownloading ? t("share.exportingPdf") : t("print.printOrSavePdf")}
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                href={`/projects/${project.id}`}
              >
                {t("print.backToEditorButton")}
              </Link>
            </div>
          </div>
        </section>

        <article className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-soft print:rounded-none print:border-0 print:shadow-none sm:rounded-[32px]">
          <header className="border-b border-black/8 bg-[linear-gradient(135deg,#17344f_0%,#184d3f_55%,#2c7864_100%)] px-5 py-7 text-white sm:px-8 sm:py-8">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              {t("share.proposalEyebrow")}
            </div>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {project.title || t("share.untitledProject")}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 sm:text-base">
              {renderParagraph(project.summary, t("share.defaultSummary"))}
            </p>
          </header>

          <div className="px-5 py-7 sm:px-8 sm:py-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCard label={t("share.clientName")} value={project.clientName || t("share.defaultDuration")} />
              <InfoCard label={t("editorScreen.fieldClientCompany")} value={project.clientCompany || t("share.defaultDuration")} />
              <InfoCard label={t("share.projectType")} value={projectTypeLabelMap[project.projectType]} />
              <InfoCard label={t("share.industry")} value={project.industry || t("share.defaultIndustry")} />
            </section>

            <section className="mt-8 grid gap-6 border-t border-black/8 pt-6 sm:grid-cols-2">
              <ContentBlock title={t("share.projectBackground")} content={renderParagraph(project.background, t("share.defaultBackground"))} />
              <ContentBlock title={t("share.projectGoal")} content={renderParagraph(project.goal, t("share.defaultGoal"))} />
            </section>

            <section className="mt-8 border-t border-black/8 pt-6">
              <ContentBlock title={t("share.serviceScope")} content={renderParagraph(project.scope, t("share.defaultScope"))} />
            </section>

            <section className="mt-8 border-t border-black/8 pt-6">
              <ContentBlock
                title={t("share.rawRequirementSummary")}
                content={renderParagraph(project.rawRequirement, t("share.defaultRawRequirement"))}
              />
            </section>

            <section className="mt-8 border-t border-black/8 pt-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{t("share.quoteDetails")}</h3>
                <p className="text-xs leading-6 text-muted">{quoteItems.length}</p>
              </div>

              <div className="mt-4 space-y-4">
                {quoteItems.map((item) => (
                  <article className="rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4 sm:p-5" key={item.id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold text-ink">{item.name}</h4>
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-muted">
                            {item.quantity} {item.unit || t("share.defaultUnit")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {renderParagraph(item.description, t("share.defaultItemDescription"))}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">{t("share.subtotal")}</p>
                        <strong className="mt-2 block font-display text-2xl text-pine">
                          {formatMoney(item.subtotal)}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-[24px] bg-gradient-to-r from-pineSoft to-[#f6efe3] p-5 sm:p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("share.totalPrice")}</span>
              <strong className="mt-2 block font-display text-4xl text-pine">{formatMoney(project.totalPrice)}</strong>
              <p className="mt-3 text-sm leading-7 text-muted">
                {t("share.deliveryNote").replace("{value}", renderParagraph(project.deliveryNote, t("share.defaultDeliveryNote")))}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">
                {t("share.remark").replace("{value}", renderParagraph(project.remark, t("share.defaultRemark")))}
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-black/6 bg-[#fcfaf5] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-3 text-lg font-semibold text-ink">{value}</p>
    </article>
  );
}

function ContentBlock({ title, content }: { title: string; content: string }) {
  return (
    <article>
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{title}</h3>
      <p className="mt-3 text-sm leading-8 text-ink">{content}</p>
    </article>
  );
}
