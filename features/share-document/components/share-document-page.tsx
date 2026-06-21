"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { formatMessage } from "@/shared/i18n/format-message";
import { downloadFileFromResponse } from "@/shared/lib/download-file";
import { formatMoney } from "@/shared/lib/format-money";
import type { ProjectDetail, ProjectType } from "@/shared/types/project";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";
import { MobileActionBar } from "@/shared/ui/mobile-action-bar";
import { PageBackButton } from "@/shared/ui/page-back-button";

type ShareDocumentPageProps = {
  document: ProjectDetail & {
    token: string;
  };
  exportPdfEnabled: boolean;
  isLoggedIn: boolean;
  isPrintMode?: boolean;
  autoPrint?: boolean;
};

type ExportState = "idle" | "processing" | "done";
type NavigationState = "idle" | "share" | "print" | "workspace" | "login" | "new";

function renderParagraph(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export function ShareDocumentPage({
  document: shareDocument,
  exportPdfEnabled,
  isLoggedIn,
  isPrintMode = false,
  autoPrint = false
}: ShareDocumentPageProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { project, quoteItems, token } = shareDocument;
  const sharePageHref = `/share/${token}` as Route;
  const printPageHref = `/share/${token}?print=1` as Route;
  const exportPdfHref = `/api/share/${token}/export-pdf` as Route;
  const workspaceHref = "/workspace" as Route;
  const loginHref = "/login" as Route;
  const loginWithNextHref = "/login?next=/workspace" as Route;
  const createProjectHref = "/projects/new" as Route;
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [navigationState, setNavigationState] = useState<NavigationState>("idle");
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const projectTypeLabelMap: Record<ProjectType, string> = {
    website: t("projectCard.website"),
    mini_program: t("projectCard.miniProgram"),
    admin_panel: t("projectCard.adminPanel"),
    custom: t("projectCard.custom")
  };

  const exportSteps = [t("share.exportStep1"), t("share.exportStep2"), t("share.exportStep3")];

  function prefetchTargets() {
    router.prefetch(sharePageHref);
    router.prefetch(printPageHref);
    router.prefetch(workspaceHref);
    router.prefetch(loginHref);
    router.prefetch(loginWithNextHref);
    router.prefetch(createProjectHref);
  }

  async function handlePdfDownload() {
    setExportState("processing");
    setExportMessage(t("share.exportPreparingMessage"));

    try {
      const response = await fetch(exportPdfHref, {
        method: "GET"
      });

      await downloadFileFromResponse(response, "QuoteCraft-Proposal.pdf", {
        preferShare: true,
        shareTitle: project.title || "QuoteCraft Proposal PDF"
      });
      setExportState("done");
      setExportMessage(t("share.exportFinishedMessage"));
    } catch (error) {
      setExportState("idle");
      setExportMessage(error instanceof Error ? error.message : t("share.exportFailedMessage"));
    } finally {
      if (!isPrintMode) {
        setNavigationState("idle");
      }
    }
  }

  function handleNavigate(target: NavigationState, href: Route) {
    if (target === "print" && !exportPdfEnabled) {
      return;
    }

    setNavigationState(target);
    router.push(href);
  }

  useEffect(() => {
    prefetchTargets();
  }, []);

  useEffect(() => {
    if (!isPrintMode) {
      return;
    }

    const previousTitle = window.document.title;
    window.document.title = `${project.title || t("share.untitledProject")} - ${t("share.printPreviewTitle")}`;

    return () => {
      window.document.title = previousTitle;
    };
  }, [isPrintMode, project.title, t]);

  useEffect(() => {
    if (!isPrintMode || !autoPrint) {
      return;
    }

    router.replace(printPageHref);
    void handlePdfDownload();
  }, [autoPrint, isPrintMode, printPageHref, router]);

  const exportButtonLabel =
    exportState === "processing" ? t("share.exportingPdf") : t("share.exportPdfToLocal");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,125,104,0.14),_transparent_36%),linear-gradient(180deg,#f6f1e8_0%,#f8f6f0_45%,#ffffff_100%)] print:bg-white">
      <PageTopBar
        backHref={isPrintMode ? sharePageHref : isLoggedIn ? workspaceHref : loginHref}
        backLabel={isPrintMode ? t("share.backToProposal") : isLoggedIn ? t("share.backToWorkspace") : t("share.backToLogin")}
        eyebrow={t("share.brand")}
        title={isPrintMode ? t("share.printPreviewTitle") : t("share.customerPageTitle")}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 pb-36 pt-4 sm:px-6 sm:pb-40 sm:pt-5 lg:flex-row lg:items-start lg:gap-8 lg:py-8 print:max-w-5xl print:px-0 print:py-0">
        <section className="flex-1 rounded-[30px] border border-black/5 bg-[#fffdfa] p-5 shadow-soft sm:rounded-[32px] sm:p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          {isPrintMode ? (
            <div className="mb-5 rounded-[24px] border border-sky-100 bg-sky-50/92 p-4 text-sm leading-7 text-sky-900 print:hidden sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{t("share.printGuideEyebrow")}</p>
                  <p className="mt-2 font-semibold text-ink">{t("share.printGuideTitle")}</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                  {exportState === "processing"
                    ? t("share.printGuideProcessing")
                    : exportState === "done"
                      ? t("share.printGuideReady")
                      : t("share.printGuideWaiting")}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {exportSteps.map((step, index) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-900"
                    key={step}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
                      {index + 1}
                    </span>
                    {step}
                  </span>
                ))}
              </div>

              {exportMessage ? <p className="mt-3 text-xs leading-6 text-pine">{exportMessage}</p> : null}
            </div>
          ) : (
            <div className="mb-5 rounded-[24px] border border-amber-200 bg-amber-50/92 p-4 text-sm leading-7 text-amber-800 print:hidden sm:p-5">
              {t("share.shareIntroMessage")}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-pine/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
              <span>{t("share.readonlyBadge")}</span>
              <span className="h-1 w-1 rounded-full bg-pine/40" />
              <span>{isPrintMode ? t("share.pdfExportPage") : t("share.customerSharePage")}</span>
            </div>
            <p className="text-xs leading-6 text-muted">{formatMessage(t("share.shareTokenLabel"), { token })}</p>
          </div>

          <header className="mt-5 rounded-[28px] bg-[linear-gradient(135deg,#17344f_0%,#184d3f_55%,#2c7864_100%)] px-5 py-7 text-white sm:px-6 sm:py-8 print:mt-0 print:rounded-none">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              {t("share.proposalEyebrow")}
            </div>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {project.title || t("share.untitledProject")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 sm:text-base">
              {renderParagraph(project.summary, t("share.defaultSummary"))}
            </p>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard label={t("share.clientName")} value={project.clientName || t("share.defaultDuration")} />
            <InfoCard label={t("share.projectType")} value={projectTypeLabelMap[project.projectType]} />
            <InfoCard label={t("share.industry")} value={project.industry || t("share.defaultIndustry")} />
            <InfoCard label={t("share.duration")} value={project.duration || t("share.defaultDuration")} />
          </div>

          <section className="mt-8 grid gap-5 border-t border-black/8 pt-6 sm:grid-cols-2">
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
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{t("share.quoteDetails")}</h2>
              <p className="text-xs leading-6 text-muted">
                {formatMessage(t("share.quoteItemsCount"), { count: quoteItems.length })}
              </p>
            </div>
            <div className="mt-4 space-y-4">
              {quoteItems.map((item) => (
                <article className="rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4 sm:p-5" key={item.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-ink">{item.name}</h3>
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
              {formatMessage(t("share.deliveryNote"), {
                value: renderParagraph(project.deliveryNote, t("share.defaultDeliveryNote"))
              })}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              {formatMessage(t("share.remark"), {
                value: renderParagraph(project.remark, t("share.defaultRemark"))
              })}
            </p>
          </section>
        </section>

        {isPrintMode ? (
          <MobileActionBar
            note={t("share.printNote")}
            primaryAction={
              <button
                className="inline-flex items-center justify-center rounded-[18px] bg-pine px-4 text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(24,77,63,0.16)] disabled:cursor-not-allowed disabled:bg-pine/60"
                disabled={exportState === "processing"}
                onClick={() => {
                  void handlePdfDownload();
                }}
                type="button"
              >
                {exportState === "processing" ? t("share.exportingPdf") : t("share.exportPdf")}
              </button>
            }
            secondaryAction={
              <button
                className="inline-flex items-center justify-center rounded-[18px] border border-black/8 bg-white/94 px-4 text-[15px] font-semibold text-ink shadow-[0_8px_18px_rgba(19,33,29,0.05)]"
                onClick={() => handleNavigate("share", sharePageHref)}
                onFocus={prefetchTargets}
                onMouseEnter={prefetchTargets}
                onTouchStart={prefetchTargets}
                type="button"
              >
                {navigationState === "share" ? t("workspace.creatingProject") : t("share.returnToProposal")}
              </button>
            }
          />
        ) : (
          <>
            <aside className="hidden w-full shrink-0 lg:sticky lg:top-28 lg:block lg:w-[320px] print:hidden">
              <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-soft sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{t("share.outputActions")}</p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-ink">{t("share.outputTitle")}</h2>
                <p className="mt-4 text-sm leading-7 text-muted">{t("share.outputDescription")}</p>

                <div className="mt-6 rounded-[22px] border border-pine/10 bg-pine/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{t("share.recommendedAction")}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pine">{t("share.recommendedTag")}</span>
                  </div>
                  <button
                    className="mt-3 inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-pine px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-pine/55"
                    disabled={!exportPdfEnabled}
                    onClick={() => {
                      setNavigationState("print");
                      void handlePdfDownload();
                    }}
                    onFocus={prefetchTargets}
                    onMouseEnter={prefetchTargets}
                    onTouchStart={prefetchTargets}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ButtonLoadingContent
                        idleLabel={exportButtonLabel}
                        loading={navigationState === "print"}
                        loadingLabel={t("workspace.creatingProject")}
                      />
                    </span>
                  </button>
                  <div className="mt-3 space-y-2 text-xs leading-6 text-muted">
                    {exportSteps.map((step, index) => (
                      <p key={step}>
                        {index + 1}. {step}
                      </p>
                    ))}
                  </div>
                  {!exportPdfEnabled ? (
                    <p className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800">
                      {t("share.exportDisabledDescription")}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                    disabled={!exportPdfEnabled}
                    onClick={() => handleNavigate("print", printPageHref)}
                    onFocus={prefetchTargets}
                    onMouseEnter={prefetchTargets}
                    onTouchStart={prefetchTargets}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ButtonLoadingContent
                        idleLabel={t("share.previewPdfVersion")}
                        loading={navigationState === "print"}
                        loadingLabel={t("workspace.creatingProject")}
                        spinnerTone="dark"
                      />
                    </span>
                  </button>
                  {isLoggedIn ? (
                    <>
                      <button
                        className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                        onClick={() => handleNavigate("workspace", workspaceHref)}
                        onFocus={prefetchTargets}
                        onMouseEnter={prefetchTargets}
                        onTouchStart={prefetchTargets}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ButtonLoadingContent
                            idleLabel={t("share.backToWorkspaceButton")}
                            loading={navigationState === "workspace"}
                            loadingLabel={t("workspace.creatingProject")}
                            spinnerTone="dark"
                          />
                        </span>
                      </button>
                      <button
                        className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                        onClick={() => handleNavigate("new", createProjectHref)}
                        onFocus={prefetchTargets}
                        onMouseEnter={prefetchTargets}
                        onTouchStart={prefetchTargets}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ButtonLoadingContent
                            idleLabel={t("share.createFormalProject")}
                            loading={navigationState === "new"}
                            loadingLabel={t("workspace.creatingProject")}
                            spinnerTone="dark"
                          />
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                        onClick={() => handleNavigate("login", loginWithNextHref)}
                        onFocus={prefetchTargets}
                        onMouseEnter={prefetchTargets}
                        onTouchStart={prefetchTargets}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ButtonLoadingContent
                            idleLabel={t("share.loginToCreateProject")}
                            loading={navigationState === "login"}
                            loadingLabel={t("workspace.creatingProject")}
                            spinnerTone="dark"
                          />
                        </span>
                      </button>
                      <button
                        className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                        onClick={() => handleNavigate("login", loginHref)}
                        onFocus={prefetchTargets}
                        onMouseEnter={prefetchTargets}
                        onTouchStart={prefetchTargets}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ButtonLoadingContent
                            idleLabel={t("share.backToLoginButton")}
                            loading={navigationState === "login"}
                            loadingLabel={t("workspace.creatingProject")}
                            spinnerTone="dark"
                          />
                        </span>
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-6 rounded-[22px] border border-black/8 bg-black/[0.03] p-4 text-sm leading-7 text-muted">
                  {t("share.readonlyNotice")}
                </div>
              </section>
            </aside>

            <MobileActionBar
              note={t("share.printNote")}
              primaryAction={
                <button
                  className="inline-flex items-center justify-center rounded-[18px] bg-pine px-4 text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(24,77,63,0.16)] disabled:cursor-not-allowed disabled:bg-pine/55"
                  disabled={!exportPdfEnabled}
                  onClick={() => {
                    setNavigationState("print");
                    void handlePdfDownload();
                  }}
                  onFocus={prefetchTargets}
                  onMouseEnter={prefetchTargets}
                  onTouchStart={prefetchTargets}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <ButtonLoadingContent
                      idleLabel={t("share.exportPdf")}
                      loading={navigationState === "print"}
                      loadingLabel={t("workspace.creatingProject")}
                    />
                  </span>
                </button>
              }
              secondaryAction={
                <button
                  className="inline-flex items-center justify-center rounded-[18px] border border-black/8 bg-white/94 px-4 text-[15px] font-semibold text-ink shadow-[0_8px_18px_rgba(19,33,29,0.05)] disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                  disabled={!exportPdfEnabled}
                  onClick={() => handleNavigate("print", printPageHref)}
                  onFocus={prefetchTargets}
                  onMouseEnter={prefetchTargets}
                  onTouchStart={prefetchTargets}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <ButtonLoadingContent
                      idleLabel={t("share.previewPdfVersion")}
                      loading={navigationState === "print"}
                      loadingLabel={t("workspace.creatingProject")}
                      spinnerTone="dark"
                    />
                  </span>
                </button>
              }
            />
          </>
        )}
      </div>
    </main>
  );
}

function PageTopBar({
  title,
  eyebrow,
  backHref,
  backLabel
}: {
  title: string;
  eyebrow: string;
  backHref: Route;
  backLabel: string;
}) {
  return (
    <div className="app-safe-top app-top-bar app-top-bar-compact sticky top-0 z-30 print:hidden">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 py-3 sm:grid-cols-[48px_minmax(0,1fr)_48px]">
          <div className="shrink-0">
            <PageBackButton fallbackHref={backHref} label={backLabel} />
          </div>
          <div className="min-w-0 text-center">
            <p className="truncate text-[16px] font-semibold text-ink sm:text-[18px]">{title}</p>
            <p className="mt-0.5 truncate text-[11px] tracking-[0.18em] text-muted">{eyebrow}</p>
          </div>
          <div aria-hidden="true" className="h-11 w-11 sm:h-12 sm:w-12" />
        </div>
      </div>
    </div>
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
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{title}</h2>
      <p className="mt-3 text-sm leading-8 text-ink">{content}</p>
    </article>
  );
}
