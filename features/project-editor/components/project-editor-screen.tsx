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
import { formatDateTime } from "@/shared/lib/format-datetime";
import { formatMoney } from "@/shared/lib/format-money";
import { queryKeys } from "@/shared/lib/query-keys";
import type { ProjectDetail, QuoteItem } from "@/shared/types/project";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
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

export function ProjectEditorScreen({ mode, store }: ProjectEditorScreenProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const printRouteHref = detail.project.id ? (`/projects/${detail.project.id}/print` as Route) : null;

  function resetNavigationStateSoon() {
    window.setTimeout(() => {
      setNavigationState("idle");
    }, 1200);
  }

  function openPrintPage(projectId: string) {
    setNavigationState("print");
    window.open(`/projects/${projectId}/print`, "_blank", "noopener,noreferrer");
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
          ? "正在保存项目..."
          : trigger === "export"
            ? "正在保存并准备导出 PDF..."
            : "正在自动保存..."
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

      const data = (await response.json()) as ProjectDetail;

      if (!response.ok) {
        setSaving(false);
        setSaveState({
          kind: "error",
          message: "保存失败，请稍后重试。"
        });
        return null;
      }

      applySavedProjectData(data);

      if (trigger === "manual") {
        setSaveState({
          kind: "success",
          message: mode === "create" ? "项目已创建，正在返回工作台..." : "项目已保存，正在返回工作台..."
        });
        setNavigationState("workspace");
        router.replace((mode === "create" ? "/workspace?saved=created" : "/workspace?saved=1") as Route);
        return data;
      }

      if (trigger === "export") {
        setSaveState({
          kind: "success",
          message: "项目已保存，正在打开导出页..."
        });
        return data;
      }

      setSaveState({
        kind: "success",
        message: "草稿已自动保存。"
      });

      return data;
    } catch {
      setSaving(false);
      setSaveState({
        kind: "error",
        message: "保存请求失败，请检查本地环境。"
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
    };

    if (!response.ok || !data.shareToken || !data.shareUrl) {
      throw new Error(data.error ?? "生成分享链接失败。");
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
      message: "正在生成分享链接..."
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
      if (mode === "create" || dirty) {
        const saved = await persistDetail("export");

        if (saved?.project.id) {
          openPrintPage(saved.project.id);
        }

        return;
      }

      openPrintPage(detail.project.id);
    });
  }

  function handleOpenSharePage() {
    setNavigationState("share");
    setShareFeedback("正在打开客户页...");

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
            message: "客户分享页已打开。"
          });
          setShareFeedback("客户分享页已打开。");
          resetNavigationStateSoon();
        } catch (error) {
          const message = error instanceof Error ? error.message : "打开分享页失败。";
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
          message: "分享链接已复制。"
        });
        setShareFeedback("分享链接已复制到剪贴板。");
      } catch (error) {
        const message = error instanceof Error ? error.message : "复制分享链接失败。";
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
        message: target === "summary" ? "AI 正在生成项目简介，请稍候..." : "AI 正在生成服务范围，请稍候..."
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
        };

        if (!response.ok || !data.text) {
          setAiState({
            kind: "error",
            message: "AI 生成失败，请稍后重试。"
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
          message: target === "summary" ? "项目简介已生成并回填。" : "服务范围已生成并回填。"
        });
      } catch {
        setAiState({
          kind: "error",
          message: "AI 请求失败，请检查本地环境。"
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

    if (printRouteHref) {
      router.prefetch(printRouteHref);
    }
  }, [printRouteHref, router, shareRouteHref, workspaceHref]);

  useEffect(() => {
    const created = searchParams.get("created");

    if (created !== "1" || createdNoticeHandledRef.current) {
      return;
    }

    createdNoticeHandledRef.current = true;
    setSaveState({
      kind: "success",
      message: "项目创建成功，已进入编辑页。"
    });
    router.replace(pathname as Route);
  }, [pathname, router, searchParams]);

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

  return (
    <>
      <div className="grid gap-6 pb-32 lg:grid-cols-[1.2fr_0.8fr] lg:pb-0">
        <section className="space-y-6">
          <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
            <h2 className="font-display text-[1.9rem] leading-[1.08] text-ink sm:text-[2.2rem]">基础信息</h2>
            <div className="mt-4">
              <SaveStatus kind={saveState.kind} message={saveState.message} />
              {lastSavedAt ? (
                <p className="mt-2 text-xs leading-6 text-muted">最近保存时间：{formatDateTime(lastSavedAt)}</p>
              ) : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="项目名称">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("title", event.target.value)}
                  value={detail.project.title}
                />
              </Field>
              <Field label="客户名称">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("clientName", event.target.value)}
                  value={detail.project.clientName}
                />
              </Field>
              <Field label="客户公司">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("clientCompany", event.target.value)}
                  value={detail.project.clientCompany ?? ""}
                />
              </Field>
              <Field label="客户行业">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("industry", event.target.value)}
                  value={detail.project.industry ?? ""}
                />
              </Field>
              <Field label="联系电话">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("contactPhone", event.target.value)}
                  value={detail.project.contactPhone ?? ""}
                />
              </Field>
            </div>
          </article>

          <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
            <h2 className="font-display text-[1.9rem] leading-[1.08] text-ink sm:text-[2.2rem]">项目说明</h2>
            <div className="mt-5 space-y-4">
              <Field label="项目简介">
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("summary", event.target.value)}
                  value={detail.project.summary ?? ""}
                />
              </Field>
              <Field label="服务范围">
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                  onChange={(event) => setProjectField("scope", event.target.value)}
                  value={detail.project.scope ?? ""}
                />
              </Field>
              <Field label="原始需求">
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
                <h2 className="font-display text-[1.9rem] leading-[1.08] text-ink sm:text-[2.2rem]">报价项</h2>
                <p className="mt-2 text-sm text-muted">先搭好报价骨架，后面再继续补充说明、排序和细节。</p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold whitespace-nowrap text-white"
                onClick={addQuoteItem}
                type="button"
              >
                新增一项
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
              Preview
            </div>
            <h2 className="mt-4 font-display text-[2.1rem] leading-[1.02] sm:text-[2.6rem]">
              {detail.project.title || "未命名项目"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80">{detail.project.summary || "请先补充项目简介。"}</p>
            <div className="mt-6 rounded-[24px] bg-white/10 p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-white/70">总金额</span>
              <strong className="mt-2 block font-display text-4xl">{formatMoney(total)}</strong>
            </div>
          </article>

          <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[1.85rem] leading-[1.08] text-ink sm:text-[2.1rem]">AI 与输出</h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  AI 生成时会锁定相关按钮，并在这里实时提示进度，让用户知道内容仍在生成中。
                </p>
              </div>
              {isAiPending ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-pine/8 px-3 py-2 text-xs font-semibold text-pine">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-pine" />
                  生成中
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <AiStatus kind={aiState.kind} message={aiState.message} />
              {mode === "create" ? (
                <p className="mt-2 text-xs leading-6 text-muted">
                  新建项目建议先补充行业和原始需求，再用 AI 生成文案，最后点“创建并保存”。
                </p>
              ) : null}
              {shareFeedback ? <p className="mt-2 text-xs leading-6 text-muted">{shareFeedback}</p> : null}
            </div>

            {isAiPending ? (
              <div className="mt-4 rounded-[22px] border border-pine/10 bg-pine/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-pine/30 border-t-pine" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {aiTarget === "summary" ? "正在生成项目简介" : "正在生成服务范围"}
                    </p>
                    <p className="text-xs leading-6 text-muted">通常几秒内完成，生成后会自动回填到表单。</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={isAiPending}
                onClick={() => handleAiGenerate("summary")}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel="AI 生成项目简介"
                    loading={isAiPending && aiTarget === "summary"}
                    loadingLabel="正在生成简介..."
                    spinnerTone="dark"
                  />
                </span>
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={isAiPending}
                onClick={() => handleAiGenerate("scope")}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel="AI 生成服务范围"
                    loading={isAiPending && aiTarget === "scope"}
                    loadingLabel="正在生成范围..."
                    spinnerTone="dark"
                  />
                </span>
              </button>

              <button
                className="hidden min-h-12 items-center justify-center gap-2 rounded-full bg-pine px-5 py-3 text-sm font-semibold whitespace-nowrap text-white disabled:cursor-not-allowed disabled:opacity-70 lg:inline-flex"
                disabled={isPending || saving || isExportPending || isSharePending || isCopyPending}
                onFocus={() => {
                  if (printRouteHref) {
                    router.prefetch(printRouteHref);
                  }
                }}
                onMouseEnter={() => {
                  if (printRouteHref) {
                    router.prefetch(printRouteHref);
                  }
                }}
                onTouchStart={() => {
                  if (printRouteHref) {
                    router.prefetch(printRouteHref);
                  }
                }}
                onClick={handleExportPdf}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel="导出 PDF"
                    loading={isExportPending || navigationState === "print"}
                    loadingLabel="正在准备 PDF..."
                  />
                </span>
              </button>
              <button
                className="hidden min-h-12 items-center justify-center rounded-full bg-navy px-5 py-3 text-sm font-semibold whitespace-nowrap text-white lg:inline-flex"
                disabled={isPending || saving || isExportPending || isSharePending || isCopyPending}
                onFocus={() => router.prefetch(workspaceHref)}
                onMouseEnter={() => router.prefetch(workspaceHref)}
                onTouchStart={() => router.prefetch(workspaceHref)}
                onClick={handleSave}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={mode === "create" ? "创建并保存" : "保存修改"}
                    loading={isPending || saving || navigationState === "workspace"}
                    loadingLabel={mode === "create" ? "正在创建..." : "正在保存..."}
                  />
                </span>
              </button>

              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={isPending || saving || isExportPending || isSharePending || isCopyPending}
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
                onClick={handleOpenSharePage}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel="查看客户页"
                    loading={navigationState === "share" || isSharePending}
                    loadingLabel="正在打开..."
                    spinnerTone="dark"
                  />
                </span>
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
                disabled={isPending || saving || isExportPending || isSharePending || isCopyPending}
                onClick={handleCopyShareLink}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel="复制分享链接"
                    loading={isCopyPending}
                    loadingLabel="正在复制..."
                    spinnerTone="dark"
                  />
                </span>
              </button>

              <div className="rounded-[20px] border border-black/6 bg-black/[0.025] px-4 py-3 text-xs leading-6 text-muted lg:hidden">
                保存和 PDF 导出已合并到底部固定操作区，当前区域只保留 AI 与分享相关动作。
              </div>
            </div>
          </article>
        </aside>
      </div>

      <MobileActionBar
        note={
          mode === "create"
            ? "建议先补充基础信息，再创建并保存项目。"
            : "移动端可直接保存修改，或导出 PDF 继续发给客户。"
        }
        primaryAction={
          <button
            className="inline-flex items-center justify-center rounded-[18px] bg-navy px-4 text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(23,52,79,0.16)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending || saving || isExportPending || isSharePending || isCopyPending}
            onFocus={() => router.prefetch(workspaceHref)}
            onMouseEnter={() => router.prefetch(workspaceHref)}
            onTouchStart={() => router.prefetch(workspaceHref)}
            onClick={handleSave}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={mode === "create" ? "创建并保存" : "保存修改"}
                loading={isPending || saving || navigationState === "workspace"}
                loadingLabel={mode === "create" ? "正在创建..." : "正在保存..."}
              />
            </span>
          </button>
        }
        secondaryAction={
          <button
            className="inline-flex items-center justify-center rounded-[18px] border border-black/8 bg-white/94 px-4 text-[15px] font-semibold text-ink shadow-[0_8px_18px_rgba(19,33,29,0.05)] disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
            disabled={isPending || saving || isExportPending || isSharePending || isCopyPending}
            onFocus={() => {
              if (printRouteHref) {
                router.prefetch(printRouteHref);
              }
            }}
            onMouseEnter={() => {
              if (printRouteHref) {
                router.prefetch(printRouteHref);
              }
            }}
            onTouchStart={() => {
              if (printRouteHref) {
                router.prefetch(printRouteHref);
              }
            }}
            onClick={handleExportPdf}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel="导出 PDF"
                loading={isExportPending || navigationState === "print"}
                loadingLabel="准备 PDF..."
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="rounded-[24px] border border-black/5 bg-[#fcfaf5] p-5">
        <div className="grid gap-4">
          <Field label="模块名称">
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              onChange={(event) => onChange({ name: event.target.value })}
              value={item.name}
            />
          </Field>
          <Field label="模块描述">
            <textarea
              className="min-h-24 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              onChange={(event) => onChange({ description: event.target.value })}
              value={item.description ?? ""}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="单价">
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                onChange={(event) => onChange({ unitPrice: Number(event.target.value) })}
                type="number"
                value={item.unitPrice}
              />
            </Field>
            <Field label="数量">
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                onChange={(event) => onChange({ quantity: Number(event.target.value) })}
                type="number"
                value={item.quantity}
              />
            </Field>
            <Field label="单位">
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
            删除
          </button>
        </div>
      </div>

      <ConfirmDialog
        cancelLabel="先不删"
        confirmLabel="确认删除"
        confirmTone="danger"
        description="删除后该报价项会立刻从当前方案中移除，无法直接恢复。"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onRemove();
        }}
        open={confirmOpen}
        title="确认删除这个报价项？"
      />
    </>
  );
}
