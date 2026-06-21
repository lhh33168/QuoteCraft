"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useStore } from "zustand";
import { AiStatus } from "@/features/project-editor/components/ai-status";
import { SaveStatus } from "@/features/project-editor/components/save-status";
import { buildAiPayload } from "@/features/project-editor/lib/build-ai-payload";
import { buildProjectDetailPayload } from "@/features/project-editor/lib/project-detail-payload";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { formatMessage } from "@/shared/i18n/format-message";
import { downloadFileFromResponse } from "@/shared/lib/download-file";
import { formatDateTime } from "@/shared/lib/format-datetime";
import { formatMoney } from "@/shared/lib/format-money";
import { queryKeys } from "@/shared/lib/query-keys";
import type { ProjectDetail, QuoteItem } from "@/shared/types/project";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { BillingLimitBanner } from "@/shared/ui/billing-limit-banner";
import { MobileActionBar } from "@/shared/ui/mobile-action-bar";

type ProjectEditorScreenProps = {
  mode: "create" | "edit";
  store: ReturnType<
    typeof import("@/features/project-editor/store/project-editor-store").createProjectEditorStore
  >;
};

type AiTarget = "summary" | "scope";
type SaveTrigger = "manual" | "auto" | "export";
type NavigationState = "idle" | "share" | "print" | "workspace";

async function downloadPdfFile(url: string) {
  const response = await fetch(url, {
    method: "GET"
  });
  return downloadFileFromResponse(response, "QuoteCraft-Proposal.pdf", {
    preferShare: true,
    shareTitle: "QuoteCraft Proposal PDF"
  });
}

export function ProjectEditorScreen({ mode, store }: ProjectEditorScreenProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const detail = useStore(store, (state) => state.detail);
  const dirty = useStore(store, (state) => state.dirty);
  const saving = useStore(store, (state) => state.saving);
  const lastSavedAt = useStore(store, (state) => state.lastSavedAt);
  const total = useStore(store, (state) => state.total());
  const setProjectField = useStore(store, (state) => state.setProjectField);
  const updateQuoteItem = useStore(store, (state) => state.updateQuoteItem);
  const addQuoteItem = useStore(store, (state) => state.addQuoteItem);
  const removeQuoteItem = useStore(store, (state) => state.removeQuoteItem);
  const replaceDetail = useStore(store, (state) => state.replaceDetail);
  const setSaving = useStore(store, (state) => state.setSaving);
  const markSaved = useStore(store, (state) => state.markSaved);
  const [saveState, setSaveState] = useState<{
    kind: "idle" | "saving" | "success" | "error";
    message: string | null;
  }>({
    kind: "idle",
    message: null
  });
  const [aiState, setAiState] = useState<{
    kind: "idle" | "loading" | "success" | "error";
    message: string | null;
  }>({
    kind: "idle",
    message: null
  });
  const [aiTarget, setAiTarget] = useState<AiTarget | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();
  const [isExportPending, startExportTransition] = useTransition();
  const [isSharePending, startShareTransition] = useTransition();
  const [isCopyPending, startCopyTransition] = useTransition();
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState>("idle");
  const isHydratedRef = useRef(false);
  const createdNoticeHandledRef = useRef(false);
  const workspaceHref = "/workspace" as Route;
  const shareRouteHref = detail.project.id ? (`/projects/${detail.project.id}/share` as Route) : null;

  function resetNavigationStateSoon() {
    window.setTimeout(() => {
      setNavigationState("idle");
    }, 1200);
  }

  async function startPdfDownload(projectId: string) {
    setNavigationState("print");
    const result = await downloadPdfFile(`/api/projects/${projectId}/export-pdf`);
    setSaveState({
      kind: "success",
      message: result.mode === "native-share" ? t("editorScreen.savedAndOpenedNativeShare") : t("editorScreen.savedAndDownloadingPdf")
    });
    resetNavigationStateSoon();
  }

  function applySavedProjectData(data: ProjectDetail) {
    replaceDetail(data);
    markSaved(data);
    queryClient.setQueryData(queryKeys.project(data.project.id), data);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projects
    });
  }

  async function persistDetail(trigger: SaveTrigger) {
    setSaving(true);
    setSaveState({
      kind: "saving",
      message:
        trigger === "manual"
          ? t("editorScreen.savingProject")
          : trigger === "export"
            ? t("editorScreen.savingBeforeExport")
            : t("editorScreen.autoSaving")
    });

    try {
      const payload = buildProjectDetailPayload({
        ...detail,
        project: {
          ...detail.project,
          totalPrice: total.toFixed(2)
        }
      });

      const response = await fetch(mode === "create" ? "/api/projects" : `/api/projects/${detail.project.id}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as ProjectDetail & {
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        setSaving(false);
        setSaveState({
          kind: "error",
          message:
            data.code === "PROJECT_LIMIT_REACHED"
              ? t("editorScreen.projectLimitInline")
              : (data.error ?? t("editorScreen.saveFailed"))
        });
        return null;
      }

      applySavedProjectData(data);

      if (trigger === "manual") {
        setSaveState({
          kind: "success",
          message: mode === "create" ? t("editorScreen.createdAndReturning") : t("editorScreen.savedAndReturning")
        });
        setNavigationState("workspace");
        router.replace((mode === "create" ? "/workspace?saved=created" : "/workspace?saved=1") as Route);
        return data;
      }

      if (trigger === "export") {
        setSaveState({
          kind: "success",
          message: t("editorScreen.savedAndDownloadingPdf")
        });
        return data;
      }

      setSaveState({
        kind: "success",
        message: t("editorScreen.draftAutoSaved")
      });

      return data;
    } catch {
      setSaving(false);
      setSaveState({
        kind: "error",
        message: t("editorScreen.saveRequestFailed")
      });
      return null;
    }
  }

  async function ensureShareUrl(projectId: string) {
    const response = await fetch(`/api/projects/${projectId}/share`, {
      method: "POST"
    });
    const data = (await response.json()) as {
      shareToken?: string;
      shareUrl?: string;
      error?: string;
      code?: string;
    };

    if (!response.ok || !data.shareToken || !data.shareUrl) {
      throw new Error(data.code === "SHARE_DISABLED" ? t("editorScreen.shareDisabledInline") : (data.error ?? t("editorScreen.shareLinkGenerateFailed")));
    }

    replaceDetail({
      ...detail,
      project: {
        ...detail.project,
        shareToken: data.shareToken,
        status: "shared"
      }
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projects
    });

    return data.shareUrl;
  }

  async function prepareShareUrl() {
    let currentProjectId = detail.project.id;

    if (mode === "create" || dirty) {
      const saved = await persistDetail("export");

      if (!saved?.project.id) {
        return null;
      }

      currentProjectId = saved.project.id;
    }

    setSaveState({
      kind: "saving",
      message: t("editorScreen.generatingShareLink")
    });

    return ensureShareUrl(currentProjectId);
  }

  function handleSave() {
    startTransition(async () => {
      await persistDetail("manual");
    });
  }

  function handleExportPdf() {
    startExportTransition(async () => {
      try {
        if (mode === "create" || dirty) {
          const saved = await persistDetail("export");

          if (saved?.project.id) {
            await startPdfDownload(saved.project.id);
          }

          return;
        }

        await startPdfDownload(detail.project.id);
      } catch (error) {
        setNavigationState("idle");
        setSaveState({
          kind: "error",
          message: error instanceof Error ? error.message : t("editorScreen.exportPdfFailed")
        });
      }
    });
  }

  function handleOpenSharePage() {
    setNavigationState("share");
    setShareFeedback(t("editorScreen.openingSharePage"));

    if (mode === "create" || dirty) {
      startShareTransition(async () => {
        try {
          const shareUrl = await prepareShareUrl();

          if (!shareUrl) {
            setNavigationState("idle");
            return;
          }

          const absoluteUrl = new URL(shareUrl, window.location.origin).toString();
          window.open(absoluteUrl, "_blank", "noopener,noreferrer");
          setSaveState({
            kind: "success",
            message: t("editorScreen.sharePageOpened")
          });
          setShareFeedback(t("editorScreen.sharePageOpened"));
          resetNavigationStateSoon();
        } catch (error) {
          const message = error instanceof Error ? error.message : t("editorScreen.shareLinkGenerateFailed");
          setSaveState({
            kind: "error",
            message
          });
          setShareFeedback(message);
          setNavigationState("idle");
        }
      });

      return;
    }

    window.open(`/projects/${detail.project.id}/share`, "_blank", "noopener,noreferrer");
    resetNavigationStateSoon();
  }

  function handleCopyShareLink() {
    startCopyTransition(async () => {
      setShareFeedback(null);

      try {
        const shareUrl = await prepareShareUrl();

        if (!shareUrl) {
          return;
        }

        const absoluteUrl = new URL(shareUrl, window.location.origin).toString();
        await navigator.clipboard.writeText(absoluteUrl);
        setSaveState({
          kind: "success",
          message: t("editorScreen.shareLinkCopied")
        });
        setShareFeedback(t("projectCard.shareLinkCopied"));
      } catch (error) {
        const message = error instanceof Error ? error.message : t("editorScreen.shareLinkCopyFailed");
        setSaveState({
          kind: "error",
          message
        });
        setShareFeedback(message);
      }
    });
  }

  function handleAiGenerate(target: AiTarget) {
    startAiTransition(async () => {
      setAiTarget(target);
      setAiState({
        kind: "loading",
        message:
          target === "summary" ? t("editorScreen.aiGeneratingSummaryStatus") : t("editorScreen.aiGeneratingScopeStatus")
      });

      try {
        const response = await fetch(
          target === "summary" ? "/api/ai/generate-summary" : "/api/ai/generate-scope",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(buildAiPayload(detail))
          }
        );

        const data = (await response.json()) as {
          text?: string;
          error?: string;
          code?: string;
        };

        if (!response.ok || !data.text) {
          setAiState({
            kind: "error",
            message: data.code === "AI_LIMIT_REACHED" ? t("editorScreen.aiLimitInline") : (data.error ?? t("editorScreen.aiFailed"))
          });
          return;
        }

        if (target === "summary") {
          setProjectField("summary", data.text);
        } else {
          setProjectField("scope", data.text);
        }

        setAiState({
          kind: "success",
          message: target === "summary" ? t("editorScreen.aiSummaryFilled") : t("editorScreen.aiScopeFilled")
        });
      } catch {
        setAiState({
          kind: "error",
          message: t("editorScreen.aiRequestFailed")
        });
      } finally {
        setAiTarget(null);
      }
    });
  }

  useEffect(() => {
    router.prefetch(workspaceHref);

    if (shareRouteHref) {
      router.prefetch(shareRouteHref);
    }

  }, [router, shareRouteHref, workspaceHref]);

  useEffect(() => {
    const created = searchParams.get("created");

    if (created !== "1" || createdNoticeHandledRef.current) {
      return;
    }

    createdNoticeHandledRef.current = true;
    setSaveState({
      kind: "success",
      message: t("editorScreen.createdEnteredEditor")
    });
    router.replace(pathname as Route);
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      return;
    }

    if (!dirty || saving || mode !== "edit") {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistDetail("auto");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [detail, dirty, mode, saving]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty || saving) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [dirty, saving]);

  const actionDisabled = isPending || saving || isExportPending || isSharePending || isCopyPending;
  const lastSavedText = lastSavedAt
    ? formatMessage(t("editorScreen.lastSavedAt"), {
        datetime: formatDateTime(lastSavedAt)
      })
    : null;

  return (
    <>
      <div className="grid gap-6 pb-32 lg:grid-cols-[1.2fr_0.8fr] lg:pb-0">
        <section className="space-y-6">
          <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
            <h2 className="font-display text-[1.9rem] leading-[1.08] text-ink sm:text-[2.2rem]">
              {t("editorScreen.basicInfo")}
            </h2>
            <div className="mt-4">
              <SaveStatus kind={saveState.kind} message={saveState.message} />
              {saveState.kind === "error" && saveState.message === t("editorScreen.projectLimitInline") ? (
                <div className="mt-3">
                  <BillingLimitBanner
                    actionLabel={t("editorScreen.limitUpgradeAction")}
                    description={t("editorScreen.projectLimitInline")}
                    href="/settings/billing"
                    title={t("workspace.projectLimitTitle")}
                  />
                </div>
              ) : null}
              {lastSavedText ? <p className="mt-2 text-xs leading-6 text-muted">{lastSavedText}</p> : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label={t("editorScreen.fieldProjectTitle")}>
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("title", event.target.value)}
                  value={detail.project.title}
                />
              </Field>
              <Field label={t("editorScreen.fieldClientName")}>
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("clientName", event.target.value)}
                  value={detail.project.clientName}
                />
              </Field>
              <Field label={t("editorScreen.fieldClientCompany")}>
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("clientCompany", event.target.value)}
                  value={detail.project.clientCompany ?? ""}
                />
              </Field>
              <Field label={t("editorScreen.fieldIndustry")}>
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("industry", event.target.value)}
                  value={detail.project.industry ?? ""}
                />
              </Field>
              <Field label={t("editorScreen.fieldContactPhone")}>
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("contactPhone", event.target.value)}
                  value={detail.project.contactPhone ?? ""}
                />
              </Field>
            </div>
          </article>

          <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
            <h2 className="font-display text-[1.9rem] leading-[1.08] text-ink sm:text-[2.2rem]">
              {t("editorScreen.projectDescription")}
            </h2>
            <div className="mt-5 space-y-4">
              <Field label={t("editorScreen.fieldSummary")}>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("summary", event.target.value)}
                  value={detail.project.summary ?? ""}
                />
              </Field>
              <Field label={t("editorScreen.fieldScope")}>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("scope", event.target.value)}
                  value={detail.project.scope ?? ""}
                />
              </Field>
              <Field label={t("editorScreen.fieldRawRequirement")}>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("rawRequirement", event.target.value)}
                  value={detail.project.rawRequirement ?? ""}
                />
              </Field>
            </div>
          </article>

          <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-[1.9rem] leading-[1.08] text-ink sm:text-[2.2rem]">
                  {t("editorScreen.quoteItems")}
                </h2>
                <p className="mt-2 text-sm text-muted">{t("editorScreen.quoteItemsDescription")}</p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-pine px-5 text-sm font-semibold text-white"
                onClick={addQuoteItem}
                type="button"
              >
                {t("editorScreen.addQuoteItem")}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {detail.quoteItems.map((item) => (
                <QuoteItemCard
                  item={item}
                  key={item.id}
                  onChange={(patch) => updateQuoteItem(item.id, patch)}
                  onRemove={() => removeQuoteItem(item.id)}
                />
              ))}
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article className="rounded-[28px] bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] p-6 text-white">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              {t("editorScreen.previewEyebrow")}
            </div>
            <h2 className="mt-4 font-display text-[2.1rem] leading-[1.02] sm:text-[2.6rem]">
              {detail.project.title || t("editorScreen.untitledProject")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80">
              {detail.project.summary || t("editorScreen.summaryEmpty")}
            </p>
            <div className="mt-6 rounded-[24px] bg-white/10 p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-white/70">{t("editorScreen.totalPrice")}</span>
              <strong className="mt-2 block font-display text-4xl">{formatMoney(total)}</strong>
            </div>
          </article>

          <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[1.85rem] leading-[1.08] text-ink sm:text-[2.1rem]">
                  {t("editorScreen.aiAndOutput")}
                </h2>
              </div>
              {isAiPending ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-pine/8 px-3 py-2 text-xs font-semibold text-pine">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-pine" />
                  {t("editorScreen.aiGeneratingBadge")}
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <AiStatus kind={aiState.kind} message={aiState.message} />
              {aiState.kind === "error" && aiState.message === t("editorScreen.aiLimitInline") ? (
                <div className="mt-3">
                  <BillingLimitBanner
                    actionLabel={t("editorScreen.limitUpgradeAction")}
                    description={t("editorScreen.aiLimitInline")}
                    href="/settings/billing"
                    title={t("billing.title")}
                  />
                </div>
              ) : null}
              {mode === "create" ? (
                <p className="mt-2 text-xs leading-6 text-muted">{t("editorScreen.createAiHint")}</p>
              ) : null}
              {shareFeedback ? <p className="mt-2 text-xs leading-6 text-muted">{shareFeedback}</p> : null}
              {shareFeedback === t("editorScreen.shareDisabledInline") ? (
                <div className="mt-3">
                  <BillingLimitBanner
                    actionLabel={t("editorScreen.limitUpgradeAction")}
                    description={t("editorScreen.shareDisabledInline")}
                    href="/settings/billing"
                    title={t("billing.title")}
                  />
                </div>
              ) : null}
            </div>

            {isAiPending ? (
              <div className="mt-4 rounded-[22px] border border-pine/10 bg-pine/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-pine/30 border-t-pine" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {aiTarget === "summary" ? t("editorScreen.aiGeneratingSummaryTitle") : t("editorScreen.aiGeneratingScopeTitle")}
                    </p>
                    <p className="text-xs leading-6 text-muted">{t("editorScreen.aiGeneratingPanelDescription")}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={isAiPending}
                onClick={() => handleAiGenerate("summary")}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={t("editorScreen.generateSummary")}
                    loading={isAiPending && aiTarget === "summary"}
                    loadingLabel={t("editorScreen.generatingSummary")}
                    spinnerTone="dark"
                  />
                </span>
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={isAiPending}
                onClick={() => handleAiGenerate("scope")}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={t("editorScreen.generateScope")}
                    loading={isAiPending && aiTarget === "scope"}
                    loadingLabel={t("editorScreen.generatingScope")}
                    spinnerTone="dark"
                  />
                </span>
              </button>

              <button
                className="hidden min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 lg:inline-flex"
                disabled={actionDisabled}
                onClick={handleExportPdf}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={t("editorScreen.exportPdf")}
                    loading={isExportPending || navigationState === "print"}
                    loadingLabel={t("editorScreen.preparingPdf")}
                  />
                </span>
              </button>
              <button
                className="hidden min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white lg:inline-flex"
                disabled={actionDisabled}
                onClick={handleSave}
                onFocus={() => router.prefetch(workspaceHref)}
                onMouseEnter={() => router.prefetch(workspaceHref)}
                onTouchStart={() => router.prefetch(workspaceHref)}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={mode === "create" ? t("editorScreen.createAndSave") : t("editorScreen.saveChanges")}
                    loading={isPending || saving || navigationState === "workspace"}
                    loadingLabel={mode === "create" ? t("editorScreen.creatingProject") : t("editorScreen.savingChanges")}
                  />
                </span>
              </button>

              <button
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={actionDisabled}
                onClick={handleOpenSharePage}
                onFocus={() => {
                  if (shareRouteHref) {
                    router.prefetch(shareRouteHref);
                  }
                }}
                onMouseEnter={() => {
                  if (shareRouteHref) {
                    router.prefetch(shareRouteHref);
                  }
                }}
                onTouchStart={() => {
                  if (shareRouteHref) {
                    router.prefetch(shareRouteHref);
                  }
                }}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={t("editorScreen.openCustomerPage")}
                    loading={navigationState === "share" || isSharePending}
                    loadingLabel={t("editorScreen.openingSharePage")}
                    spinnerTone="dark"
                  />
                </span>
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={actionDisabled}
                onClick={handleCopyShareLink}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={t("editorScreen.copyShareLink")}
                    loading={isCopyPending}
                    loadingLabel={t("editorScreen.copyingShareLink")}
                    spinnerTone="dark"
                  />
                </span>
              </button>

            </div>
          </article>
        </aside>
      </div>

      <MobileActionBar
        note={mode === "create" ? t("editorScreen.mobileNoteCreate") : t("editorScreen.mobileNoteEdit")}
        primaryAction={
          <button
            className="inline-flex items-center justify-center rounded-[18px] bg-navy px-4 text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(23,52,79,0.16)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={actionDisabled}
            onClick={handleSave}
            onFocus={() => router.prefetch(workspaceHref)}
            onMouseEnter={() => router.prefetch(workspaceHref)}
            onTouchStart={() => router.prefetch(workspaceHref)}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={mode === "create" ? t("editorScreen.createAndSave") : t("editorScreen.saveChanges")}
                loading={isPending || saving || navigationState === "workspace"}
                loadingLabel={mode === "create" ? t("editorScreen.creatingProject") : t("editorScreen.savingChanges")}
              />
            </span>
          </button>
        }
        secondaryAction={
          <button
            className="inline-flex items-center justify-center rounded-[18px] border border-black/8 bg-white/94 px-4 text-[15px] font-semibold text-ink shadow-[0_8px_18px_rgba(19,33,29,0.05)] disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
            disabled={actionDisabled}
            onClick={handleExportPdf}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("editorScreen.exportPdf")}
                loading={isExportPending || navigationState === "print"}
                loadingLabel={t("editorScreen.preparingPdf")}
                spinnerTone="dark"
              />
            </span>
          </button>
        }
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}

type QuoteItemCardProps = {
  item: QuoteItem;
  onChange: (patch: Partial<QuoteItem>) => void;
  onRemove: () => void;
};

function QuoteItemCard({ item, onChange, onRemove }: QuoteItemCardProps) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="rounded-[24px] border border-black/5 bg-[#fcfaf5] p-5">
        <div className="grid gap-4">
          <Field label={t("editorScreen.fieldModuleName")}>
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              onChange={(event) => onChange({ name: event.target.value })}
              value={item.name}
            />
          </Field>
          <Field label={t("editorScreen.fieldModuleDescription")}>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              onChange={(event) => onChange({ description: event.target.value })}
              value={item.description ?? ""}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t("editorScreen.fieldUnitPrice")}>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                onChange={(event) => onChange({ unitPrice: Number(event.target.value) })}
                type="number"
                value={item.unitPrice}
              />
            </Field>
            <Field label={t("editorScreen.fieldQuantity")}>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                onChange={(event) => onChange({ quantity: Number(event.target.value) })}
                type="number"
                value={item.quantity}
              />
            </Field>
            <Field label={t("editorScreen.fieldUnit")}>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                onChange={(event) => onChange({ unit: event.target.value })}
                value={item.unit ?? ""}
              />
            </Field>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-2xl text-pine">{formatMoney(item.subtotal)}</span>
          <button
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold whitespace-nowrap text-red-600"
            onClick={() => setConfirmOpen(true)}
            type="button"
          >
            {t("editorScreen.deleteQuoteItem")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        cancelLabel={t("editorScreen.cancelDeleteQuoteItemAction")}
        confirmLabel={t("editorScreen.confirmDeleteQuoteItemAction")}
        confirmTone="danger"
        description={t("editorScreen.confirmDeleteQuoteItemDescription")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onRemove();
        }}
        open={confirmOpen}
        title={t("editorScreen.confirmDeleteQuoteItemTitle")}
      />
    </>
  );
}
