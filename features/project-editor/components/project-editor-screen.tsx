"use client";

import Link from "next/link";
import { useStore } from "zustand";
import type { QuoteItem } from "@/shared/types/project";
import { formatMoney } from "@/shared/lib/format-money";

type ProjectEditorScreenProps = {
  store: ReturnType<
    typeof import("@/features/project-editor/store/project-editor-store").createProjectEditorStore
  >;
};

export function ProjectEditorScreen({ store }: ProjectEditorScreenProps) {
  const detail = useStore(store, (state) => state.detail);
  const total = useStore(store, (state) => state.total());
  const setProjectField = useStore(store, (state) => state.setProjectField);
  const updateQuoteItem = useStore(store, (state) => state.updateQuoteItem);
  const addQuoteItem = useStore(store, (state) => state.addQuoteItem);
  const removeQuoteItem = useStore(store, (state) => state.removeQuoteItem);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-3xl text-ink">基础信息</h2>
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
          <div className="mt-5 grid gap-3">
            <button className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink" type="button">
              AI 生成项目简介
            </button>
            <button className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink" type="button">
              AI 生成服务范围
            </button>
            <button className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white" type="button">
              导出 PDF
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
