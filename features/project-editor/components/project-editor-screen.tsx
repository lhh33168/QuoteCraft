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

type ProjectEditorScreenProps = {
  mode: "create" | "edit";
  store: ReturnType<
    typeof import("@/features/project-editor/store/project-editor-store").createProjectEditorStore
  >;
};

type AiTarget = "summary" | "scope";
type SaveTrigger = "manual" | "auto" | "export";

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
  const [isCopyPending, startCopyTransition] = useTransition();
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const isHydratedRef = useRef(false);
  const createdNoticeHandledRef = useRef(false);

  function openPrintPage(projectId: string) {
    window.open(`/projects/${projectId}/print`, "_blank", "noopener,noreferrer");
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
    setShareFeedback("正在打开客户页...");

    if (mode === "create" || dirty) {
      startCopyTransition(async () => {
        try {
          const shareUrl = await prepareShareUrl();

          if (!shareUrl) {
            return;
          }

          const absoluteUrl = new URL(shareUrl, window.location.origin).toString();
          window.open(absoluteUrl, "_blank", "noopener,noreferrer");
          setSaveState({
            kind: "success",
            message: "客户分享页已打开。"
          });
          setShareFeedback("客户分享页已打开。");
        } catch (error) {
          const message = error instanceof Error ? error.message : "打开分享页失败。";
          setSaveState({
            kind: "error",
            message
          });
          setShareFeedback(message);
        }
      });

      return;
    }

    window.open(`/projects/${detail.project.id}/share`, "_blank", "noopener,noreferrer");
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
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-3xl text-ink">基础信息</h2>
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
          <h2 className="font-display text-3xl text-ink">项目说明</h2>
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
              <h2 className="font-display text-3xl text-ink">报价项</h2>
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
          <h2 className="mt-4 font-display text-4xl leading-none">{detail.project.title || "未命名项目"}</h2>
          <p className="mt-4 text-sm leading-7 text-white/80">{detail.project.summary || "请先补充项目简介。"}</p>
          <div className="mt-6 rounded-[24px] bg-white/10 p-4">
            <span className="text-xs uppercase tracking-[0.18em] text-white/70">总金额</span>
            <strong className="mt-2 block font-display text-4xl">{formatMoney(total)}</strong>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-ink">AI 与输出</h2>
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
              {isAiPending && aiTarget === "summary" ? (
                <>
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-pine/30 border-t-pine" />
                  正在生成简介...
                </>
              ) : (
                "AI 生成项目简介"
              )}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
              disabled={isAiPending}
              onClick={() => handleAiGenerate("scope")}
              type="button"
            >
              {isAiPending && aiTarget === "scope" ? (
                <>
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-pine/30 border-t-pine" />
                  正在生成范围...
                </>
              ) : (
                "AI 生成服务范围"
              )}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-pine px-5 py-3 text-sm font-semibold whitespace-nowrap text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isPending || saving || isExportPending || isCopyPending}
              onClick={handleExportPdf}
              type="button"
            >
              {isExportPending ? (
                <>
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  正在准备 PDF...
                </>
              ) : (
                "导出 PDF"
              )}
            </button>
            <button
              className="rounded-full bg-navy px-5 py-3 text-sm font-semibold whitespace-nowrap text-white"
              disabled={isPending || saving || isExportPending || isCopyPending}
              onClick={handleSave}
              type="button"
            >
              {isPending || saving ? "保存中..." : mode === "create" ? "创建并保存" : "保存修改"}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink"
              onClick={handleOpenSharePage}
              type="button"
            >
              查看客户页
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
              disabled={isPending || saving || isExportPending || isCopyPending}
              onClick={handleCopyShareLink}
              type="button"
            >
              {isCopyPending ? "正在复制..." : "复制分享链接"}
            </button>
          </div>
        </article>
      </aside>
    </div>
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
  return (
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
          onClick={onRemove}
          type="button"
        >
          删除
        </button>
      </div>
    </div>
  );
}
