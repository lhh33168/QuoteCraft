"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useStore } from "zustand";
import type { QuoteItem } from "@/shared/types/project";
import { formatMoney } from "@/shared/lib/format-money";
import { formatDateTime } from "@/shared/lib/format-datetime";
import { SaveStatus } from "@/features/project-editor/components/save-status";
import { AiStatus } from "@/features/project-editor/components/ai-status";
import { buildAiPayload } from "@/features/project-editor/lib/build-ai-payload";
import { buildProjectDetailPayload } from "@/features/project-editor/lib/project-detail-payload";
import { queryKeys } from "@/shared/lib/query-keys";

type ProjectEditorScreenProps = {
  mode: "create" | "edit";
  store: ReturnType<
    typeof import("@/features/project-editor/store/project-editor-store").createProjectEditorStore
  >;
};

export function ProjectEditorScreen({ mode, store }: ProjectEditorScreenProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
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
  const [isPending, startTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();
  const isHydratedRef = useRef(false);

  async function persistDetail(trigger: "manual" | "auto") {
    setSaving(true);
    setSaveState({
      kind: "saving",
      message: trigger === "manual" ? "正在保存项目..." : "正在自动保存..."
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

      const data = (await response.json()) as typeof payload;

      if (!response.ok) {
        setSaving(false);
        setSaveState({
          kind: "error",
          message: "保存失败，请稍后重试。"
        });
        return;
      }

      markSaved(data);
      queryClient.setQueryData(queryKeys.project(data.project.id), data);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projects
      });
      setSaveState({
        kind: "success",
        message: trigger === "manual" ? "项目已保存。" : "草稿已自动保存。"
      });

      if (mode === "create" && data.project?.id && data.project.id !== detail.project.id) {
        router.push(`/projects/${data.project.id}`);
        router.refresh();
        return;
      }

      replaceDetail(data);
      router.refresh();
    } catch {
      setSaving(false);
      setSaveState({
        kind: "error",
        message: "保存请求失败，请检查本地环境。"
      });
    }
  }

  function handleSave() {
    startTransition(async () => {
      await persistDetail("manual");
    });
  }

  function handleAiGenerate(target: "summary" | "scope") {
    startAiTransition(async () => {
      setAiState({
        kind: "loading",
        message: target === "summary" ? "正在生成项目简介..." : "正在生成服务范围..."
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
      }
    });
  }

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
                value={detail.project.title}
                onChange={(event) => setProjectField("title", event.target.value)}
              />
            </Field>
            <Field label="客户名称">
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={detail.project.clientName}
                onChange={(event) => setProjectField("clientName", event.target.value)}
              />
            </Field>
            <Field label="客户公司">
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={detail.project.clientCompany ?? ""}
                onChange={(event) => setProjectField("clientCompany", event.target.value)}
              />
            </Field>
            <Field label="客户行业">
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={detail.project.industry ?? ""}
                onChange={(event) => setProjectField("industry", event.target.value)}
              />
            </Field>
            <Field label="联系方式">
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={detail.project.contactPhone ?? ""}
                onChange={(event) => setProjectField("contactPhone", event.target.value)}
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
                value={detail.project.summary ?? ""}
                onChange={(event) => setProjectField("summary", event.target.value)}
              />
            </Field>
            <Field label="服务范围">
              <textarea
                className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={detail.project.scope ?? ""}
                onChange={(event) => setProjectField("scope", event.target.value)}
              />
            </Field>
            <Field label="原始需求">
              <textarea
                className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
                value={detail.project.rawRequirement ?? ""}
                onChange={(event) => setProjectField("rawRequirement", event.target.value)}
              />
            </Field>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl text-ink">报价项</h2>
              <p className="mt-2 text-sm text-muted">先把骨架建起来，后续再接拖拽排序和自动保存。</p>
            </div>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-white"
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
          <h2 className="font-display text-3xl text-ink">AI 与输出</h2>
          <div className="mt-4">
            <AiStatus kind={aiState.kind} message={aiState.message} />
            {mode === "create" ? (
              <p className="mt-2 text-xs leading-6 text-muted">
                新建项目建议先补充行业与原始需求，再用 AI 生成文案，最后点击“创建并保存”。
              </p>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3">
            <button
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
              disabled={isAiPending}
              onClick={() => handleAiGenerate("summary")}
              type="button"
            >
              AI 生成项目简介
            </button>
            <button
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
              disabled={isAiPending}
              onClick={() => handleAiGenerate("scope")}
              type="button"
            >
              AI 生成服务范围
            </button>
            <button className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white" type="button">
              导出 PDF
            </button>
            <button
              className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
              disabled={isPending || saving}
              onClick={handleSave}
              type="button"
            >
              {isPending || saving ? "保存中..." : mode === "create" ? "创建并保存" : "保存修改"}
            </button>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
              href={`/share/${detail.project.shareToken ?? `share-${detail.project.id}`}`}
            >
              打开分享页
            </Link>
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
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </Field>
        <Field label="模块描述">
          <textarea
            className="min-h-24 w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
            value={item.description ?? ""}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="单价">
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              type="number"
              value={item.unitPrice}
              onChange={(event) => onChange({ unitPrice: Number(event.target.value) })}
            />
          </Field>
          <Field label="数量">
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              type="number"
              value={item.quantity}
              onChange={(event) => onChange({ quantity: Number(event.target.value) })}
            />
          </Field>
          <Field label="单位">
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3"
              value={item.unit ?? ""}
              onChange={(event) => onChange({ unit: event.target.value })}
            />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-display text-2xl text-pine">{formatMoney(item.subtotal)}</span>
        <button
          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
          onClick={onRemove}
          type="button"
        >
          删除
        </button>
      </div>
    </div>
  );
}
