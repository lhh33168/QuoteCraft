"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect } from "react";
import { formatMoney } from "@/shared/lib/format-money";
import type { ProjectDetail, ProjectType } from "@/shared/types/project";
import { PageBackButton } from "@/shared/ui/page-back-button";

type ProjectPrintPageProps = {
  detail: ProjectDetail;
};

const projectTypeLabelMap: Record<ProjectType, string> = {
  website: "官网开发",
  mini_program: "小程序开发",
  admin_panel: "后台管理系统",
  custom: "定制项目"
};

function renderParagraph(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export function ProjectPrintPage({ detail }: ProjectPrintPageProps) {
  const { project, quoteItems } = detail;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="app-safe-bottom min-h-screen bg-[#f5f1e8] print:bg-white">
      <div className="app-safe-top app-top-bar app-top-bar-compact sticky top-0 z-30 print:hidden">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 py-3 sm:grid-cols-[48px_minmax(0,1fr)_48px]">
            <div className="shrink-0">
              <PageBackButton fallbackHref={`/projects/${project.id}` as Route} label="返回编辑页" />
            </div>
            <div className="min-w-0 text-center">
              <p className="truncate text-[16px] font-semibold text-ink sm:text-[18px]">PDF 导出预览</p>
              <p className="mt-0.5 truncate text-[11px] tracking-[0.18em] text-muted">报价助手</p>
            </div>
            <div aria-hidden="true" className="h-11 w-11 sm:h-12 sm:w-12" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 print:max-w-none print:px-0 print:py-0">
        <section className="mb-5 rounded-[24px] border border-sky-100 bg-sky-50/92 p-4 text-sm leading-7 text-sky-900 print:hidden sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">导出指引</p>
              <p className="mt-2 font-semibold text-ink">页面已自动打开系统打印面板，也可以手动再次导出。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-pine px-5 text-sm font-semibold text-white"
                onClick={() => window.print()}
                type="button"
              >
                打印 / 保存为 PDF
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                href={`/projects/${project.id}`}
              >
                返回编辑页
              </Link>
            </div>
          </div>
        </section>

        <article className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-soft print:rounded-none print:border-0 print:shadow-none sm:rounded-[32px]">
          <header className="border-b border-black/8 bg-[linear-gradient(135deg,#17344f_0%,#184d3f_55%,#2c7864_100%)] px-5 py-7 text-white sm:px-8 sm:py-8">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              QuoteCraft Proposal
            </div>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {project.title || "未命名项目"}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 sm:text-base">
              {renderParagraph(project.summary, "这是一份用于客户沟通和报价确认的项目方案。")}
            </p>
          </header>

          <div className="px-5 py-7 sm:px-8 sm:py-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="客户名称" value={project.clientName || "待补充"} />
              <InfoCard label="客户公司" value={project.clientCompany || "待补充"} />
              <InfoCard label="项目类型" value={projectTypeLabelMap[project.projectType]} />
              <InfoCard label="所属行业" value={project.industry || "通用企业服务"} />
            </section>

            <section className="mt-8 grid gap-6 border-t border-black/8 pt-6 sm:grid-cols-2">
              <ContentBlock title="项目背景" content={renderParagraph(project.background, "暂无项目背景说明。")} />
              <ContentBlock title="项目目标" content={renderParagraph(project.goal, "暂无项目目标说明。")} />
            </section>

            <section className="mt-8 border-t border-black/8 pt-6">
              <ContentBlock title="服务范围" content={renderParagraph(project.scope, "暂无服务范围说明。")} />
            </section>

            <section className="mt-8 border-t border-black/8 pt-6">
              <ContentBlock
                title="原始需求摘要"
                content={renderParagraph(project.rawRequirement, "暂无原始需求摘要。")}
              />
            </section>

            <section className="mt-8 border-t border-black/8 pt-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">报价明细</h3>
                <p className="text-xs leading-6 text-muted">共 {quoteItems.length} 个报价项</p>
              </div>

              <div className="mt-4 space-y-4">
                {quoteItems.map((item) => (
                  <article className="rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4 sm:p-5" key={item.id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold text-ink">{item.name}</h4>
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-muted">
                            {item.quantity} {item.unit || "项"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {renderParagraph(item.description, "暂无报价项说明。")}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">小计</p>
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
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">项目总金额</span>
              <strong className="mt-2 block font-display text-4xl text-pine">{formatMoney(project.totalPrice)}</strong>
              <p className="mt-3 text-sm leading-7 text-muted">
                交付说明：{renderParagraph(project.deliveryNote, "暂无交付说明。")}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted">
                项目备注：{renderParagraph(project.remark, "暂无备注。")}
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
