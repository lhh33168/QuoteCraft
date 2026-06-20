"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatMoney } from "@/shared/lib/format-money";
import type { ProjectDetail, ProjectType } from "@/shared/types/project";
import { PageBackButton } from "@/shared/ui/page-back-button";

type ShareDocumentPageProps = {
  document: ProjectDetail & {
    token: string;
  };
  isLoggedIn: boolean;
  isPrintMode?: boolean;
  autoPrint?: boolean;
};

const projectTypeLabelMap: Record<ProjectType, string> = {
  website: "官网 / 品牌网站",
  mini_program: "微信小程序",
  admin_panel: "后台管理系统",
  custom: "定制开发"
};

function renderParagraph(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export function ShareDocumentPage({
  document: shareDocument,
  isLoggedIn,
  isPrintMode = false,
  autoPrint = false
}: ShareDocumentPageProps) {
  const router = useRouter();
  const { project, quoteItems, token } = shareDocument;
  const [printMessage, setPrintMessage] = useState<string | null>(
    autoPrint ? "正在打开系统打印面板，请稍候..." : null
  );
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
  const sharePageHref = `/share/${token}` as Route;
  const printPageHref = `/share/${token}?print=1` as Route;
  const autoPrintHref = `/share/${token}?print=1&autoprint=1` as Route;

  function handlePrintDownload() {
    setPrintMessage("系统打印面板已打开，请在面板中选择“保存为 PDF”或“另存为 PDF”下载到本地。");
    window.print();
  }

  useEffect(() => {
    if (!isPrintMode) {
      return;
    }

    const previousTitle = window.document.title;
    window.document.title = `${project.title || "报价方案"}-报价单`;

    return () => {
      window.document.title = previousTitle;
    };
  }, [isPrintMode, project.title]);

  useEffect(() => {
    if (!isPrintMode || !autoPrint || hasAutoPrinted) {
      return;
    }

    // 去掉 autoprint 参数，避免刷新页面后重复自动弹出打印面板。
    router.replace(printPageHref);

    const timer = window.setTimeout(() => {
      setHasAutoPrinted(true);
      handlePrintDownload();
    }, 320);

    return () => window.clearTimeout(timer);
  }, [autoPrint, hasAutoPrinted, isPrintMode, printPageHref, router]);

  useEffect(() => {
    if (!isPrintMode) {
      return;
    }

    function handleAfterPrint() {
      setPrintMessage("打印面板已关闭。你可以返回分享页，或再次点击“保存到本地 PDF”。");
    }

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [isPrintMode]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,125,104,0.14),_transparent_36%),linear-gradient(180deg,#f6f1e8_0%,#f8f6f0_45%,#ffffff_100%)] print:bg-white">
      {isPrintMode ? (
        <div className="sticky top-0 z-30 border-b border-black/6 bg-white/92 backdrop-blur-xl print:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
                href={sharePageHref}
              >
                返回分享页
              </Link>
              <button
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-pine px-4 text-sm font-semibold text-white"
                onClick={handlePrintDownload}
                type="button"
              >
                保存到本地 PDF
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
                href={printPageHref}
              >
                停留在打印版
              </Link>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
              <p>导出方式：点击“保存到本地 PDF”后，系统会打开打印面板，请在面板中选择“保存为 PDF”或“另存为 PDF”。</p>
              {printMessage ? <p className="mt-2 text-xs leading-6 text-pine">{printMessage}</p> : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="sticky top-0 z-20 border-b border-black/6 bg-white/82 backdrop-blur-xl print:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <PageBackButton
              fallbackHref={isLoggedIn ? "/workspace" : "/login"}
              label={isLoggedIn ? "返回工作台" : "返回登录"}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-pine">报价助手</p>
              <p className="truncate text-sm font-semibold text-ink">客户查看页</p>
            </div>
            <Link
              className="hidden rounded-full border border-black/8 bg-white/84 px-4 py-2 text-xs font-semibold text-ink transition hover:border-pine/30 hover:text-pine sm:inline-flex"
              href={isLoggedIn ? "/workspace" : "/login"}
            >
              {isLoggedIn ? "打开工作台" : "去登录"}
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:py-8 print:max-w-5xl print:px-0 print:py-0">
        <section className="flex-1 rounded-[32px] border border-black/5 bg-[#fffdfa]/95 p-6 shadow-soft backdrop-blur sm:p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-pine/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
              <span>公开只读</span>
              <span className="h-1 w-1 rounded-full bg-pine/40" />
              <span>{isPrintMode ? "打印版页面" : "客户分享页"}</span>
            </div>
            <p className="text-xs leading-6 text-muted">分享标识：{token}</p>
          </div>

          {!isPrintMode ? (
            <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50/90 p-4 text-sm leading-7 text-amber-800 sm:p-5 print:hidden">
              当前页面用于客户查看方案详情与报价内容。如果你要导出 PDF，请点击右侧“保存到本地 PDF”，系统会打开打印面板供你保存。
            </div>
          ) : null}

          <header className="mt-6 rounded-[28px] bg-[linear-gradient(135deg,#17344f_0%,#184d3f_55%,#2c7864_100%)] px-6 py-8 text-white print:mt-0 print:rounded-none">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              QuoteCraft Proposal
            </div>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{project.title || "未命名项目"}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 sm:text-base">
              {renderParagraph(project.summary, "这是一份用于客户查看和沟通的项目方案。")}
            </p>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="客户名称" value={project.clientName || "待补充"} />
            <InfoCard label="项目类型" value={projectTypeLabelMap[project.projectType]} />
            <InfoCard label="所属行业" value={project.industry || "通用企业服务"} />
            <InfoCard label="预计周期" value={project.duration || "待确认"} />
          </div>

          <section className="mt-8 grid gap-5 border-t border-black/8 pt-6 sm:grid-cols-2">
            <ContentBlock title="项目背景" content={renderParagraph(project.background, "暂无项目背景说明。")} />
            <ContentBlock title="项目目标" content={renderParagraph(project.goal, "暂无项目目标说明。")} />
          </section>

          <section className="mt-8 border-t border-black/8 pt-6">
            <ContentBlock title="服务范围" content={renderParagraph(project.scope, "暂无服务范围说明。")} />
          </section>

          <section className="mt-8 border-t border-black/8 pt-6">
            <ContentBlock title="原始需求摘要" content={renderParagraph(project.rawRequirement, "暂无原始需求摘要。")} />
          </section>

          <section className="mt-8 border-t border-black/8 pt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">报价明细</h2>
              <p className="text-xs leading-6 text-muted">共 {quoteItems.length} 个报价项</p>
            </div>
            <div className="mt-4 space-y-4">
              {quoteItems.map((item) => (
                <article className="rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4 sm:p-5" key={item.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-ink">{item.name}</h3>
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
            <p className="mt-2 text-sm leading-7 text-muted">项目备注：{renderParagraph(project.remark, "暂无备注。")}</p>
          </section>
        </section>

        {isPrintMode ? (
          <div className="sticky bottom-0 z-20 mt-2 border-t border-black/6 bg-white/96 p-4 shadow-[0_-12px_30px_rgba(19,33,29,0.08)] lg:hidden print:hidden">
            <div className="grid grid-cols-2 gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
                href={sharePageHref}
              >
                返回分享页
              </Link>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold text-white"
                onClick={handlePrintDownload}
                type="button"
              >
                导出 PDF
              </button>
            </div>
          </div>
        ) : (
          <aside className="w-full shrink-0 lg:sticky lg:top-8 lg:w-[320px] print:hidden">
            <section className="rounded-[28px] border border-black/5 bg-white/92 p-6 shadow-soft backdrop-blur sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">输出动作</p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-ink">把这份方案直接发给客户，或导出留档</h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                分享页适合快速查看，打印版更适合保存为 PDF、发邮件，或进入正式签约流程。
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-pine px-5 text-sm font-semibold text-white"
                  href={autoPrintHref}
                >
                  保存到本地 PDF
                </Link>
                <Link
                  className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                  href={printPageHref}
                >
                  打开打印版预览
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link
                      className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                      href="/workspace"
                    >
                      返回项目工作台
                    </Link>
                    <Link
                      className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                      href="/projects/new"
                    >
                      新建正式项目
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                      href="/login?next=/workspace"
                    >
                      登录后创建自己的方案
                    </Link>
                    <Link
                      className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                      href="/login"
                    >
                      返回登录页
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-6 rounded-[22px] border border-black/8 bg-black/[0.03] p-4 text-sm leading-7 text-muted">
                当前是只读分享页，客户可以查看方案和报价，但不会修改你的项目数据。
              </div>
            </section>
          </aside>
        )}
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
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">{title}</h2>
      <p className="mt-3 text-sm leading-8 text-ink">{content}</p>
    </article>
  );
}
