"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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

type ExportState = "idle" | "processing" | "done";

const projectTypeLabelMap: Record<ProjectType, string> = {
  website: "官网 / 品牌网站",
  mini_program: "微信小程序",
  admin_panel: "后台管理系统",
  custom: "定制开发"
};

const exportSteps = [
  "点击“导出 PDF 到本地”",
  "在系统面板里选择“保存为 PDF”",
  "选择保存位置后完成下载"
];

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
  const sharePageHref = `/share/${token}` as Route;
  const printPageHref = `/share/${token}?print=1` as Route;
  const autoPrintHref = `/share/${token}?print=1&autoprint=1` as Route;
  const [exportState, setExportState] = useState<ExportState>(autoPrint ? "processing" : "idle");
  const [exportMessage, setExportMessage] = useState<string | null>(
    autoPrint ? "正在准备导出 PDF，请稍候..." : null
  );
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

  function handlePrintDownload() {
    setExportState("processing");
    setExportMessage("系统打印面板正在打开，请在面板中选择“保存为 PDF”或“另存为 PDF”。");
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
      setExportState("done");
      setExportMessage("导出面板已关闭。你可以返回方案页，或再次点击“导出 PDF 到本地”。");
    }

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [isPrintMode]);

  const exportButtonLabel =
    exportState === "processing" ? "正在准备导出..." : "导出 PDF 到本地";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,125,104,0.14),_transparent_36%),linear-gradient(180deg,#f6f1e8_0%,#f8f6f0_45%,#ffffff_100%)] print:bg-white">
      <PageTopBar
        backHref={isPrintMode ? sharePageHref : isLoggedIn ? "/workspace" : "/login"}
        backLabel={isPrintMode ? "返回方案页" : isLoggedIn ? "返回工作台" : "返回登录"}
        eyebrow="报价助手"
        title={isPrintMode ? "PDF 导出预览" : "客户查看页"}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 pb-28 pt-4 sm:px-6 sm:pb-32 sm:pt-5 lg:flex-row lg:items-start lg:gap-8 lg:py-8 print:max-w-5xl print:px-0 print:py-0">
        <section className="flex-1 rounded-[30px] border border-black/5 bg-[#fffdfa] p-5 shadow-soft sm:rounded-[32px] sm:p-8 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          {isPrintMode ? (
            <div className="mb-5 rounded-[24px] border border-sky-100 bg-sky-50/92 p-4 text-sm leading-7 text-sky-900 print:hidden sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">导出指引</p>
                  <p className="mt-2 font-semibold text-ink">当前正在查看适合导出 PDF 的打印预览页。</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                  {exportState === "processing"
                    ? "导出进行中"
                    : exportState === "done"
                      ? "可以再次导出"
                      : "等待操作"}
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
              当前页面用于客户查看方案详情与报价内容。需要留档、发给同事，或保存到手机时，可点击“导出 PDF 到本地”。
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-pine/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
              <span>公开只读</span>
              <span className="h-1 w-1 rounded-full bg-pine/40" />
              <span>{isPrintMode ? "PDF 导出页" : "客户分享页"}</span>
            </div>
            <p className="text-xs leading-6 text-muted">分享标识：{token}</p>
          </div>

          <header className="mt-5 rounded-[28px] bg-[linear-gradient(135deg,#17344f_0%,#184d3f_55%,#2c7864_100%)] px-5 py-7 text-white sm:px-6 sm:py-8 print:mt-0 print:rounded-none">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              QuoteCraft Proposal
            </div>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {project.title || "未命名项目"}
            </h1>
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
            <ContentBlock
              title="原始需求摘要"
              content={renderParagraph(project.rawRequirement, "暂无原始需求摘要。")}
            />
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
            <strong className="mt-2 block font-display text-4xl text-pine">
              {formatMoney(project.totalPrice)}
            </strong>
            <p className="mt-3 text-sm leading-7 text-muted">
              交付说明：{renderParagraph(project.deliveryNote, "暂无交付说明。")}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              项目备注：{renderParagraph(project.remark, "暂无备注。")}
            </p>
          </section>
        </section>

        {isPrintMode ? (
          <MobileBottomBar
            note="导出 PDF 后，文件保存位置由系统打印面板决定。"
            primaryAction={
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-pine/60 sm:min-h-11"
                disabled={exportState === "processing"}
                onClick={handlePrintDownload}
                type="button"
              >
                {exportState === "processing" ? "导出中..." : "导出 PDF"}
              </button>
            }
            secondaryAction={
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-[15px] font-semibold text-ink sm:min-h-11"
                href={sharePageHref}
              >
                返回方案页
              </Link>
            }
          />
        ) : (
          <>
            <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[320px] print:hidden">
              <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-soft sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">输出动作</p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-ink">
                  把这份方案直接发给客户，或导出留档
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted">
                  分享页适合快速查看，导出 PDF 更适合留档、发邮件，或发给团队内部继续跟进。
                </p>

                <div className="mt-6 rounded-[22px] border border-pine/10 bg-pine/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">主推荐操作</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pine">推荐</span>
                  </div>
                  <Link
                    className="mt-3 inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-pine px-5 text-sm font-semibold text-white"
                    href={autoPrintHref}
                  >
                    {exportButtonLabel}
                  </Link>
                  <div className="mt-3 space-y-2 text-xs leading-6 text-muted">
                    {exportSteps.map((step, index) => (
                      <p key={step}>
                        {index + 1}. {step}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Link
                    className="inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                    href={printPageHref}
                  >
                    预览 PDF 版
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

            <MobileBottomBar
              note="导出后会打开系统打印面板，请选择“保存为 PDF”。"
              primaryAction={
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-[15px] font-semibold text-white sm:min-h-11"
                  href={autoPrintHref}
                >
                  导出 PDF
                </Link>
              }
              secondaryAction={
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-[15px] font-semibold text-ink sm:min-h-11"
                  href={printPageHref}
                >
                  预览 PDF
                </Link>
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

function MobileBottomBar({
  note,
  secondaryAction,
  primaryAction
}: {
  note: string;
  secondaryAction: ReactNode;
  primaryAction: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden print:hidden">
      <div className="app-safe-bottom-comfortable app-bottom-bar app-bottom-bar-compact w-full border-x-0 px-3 pb-0 pt-3 sm:px-6">
        <div className="pb-0">
          <p className="mb-2 text-[11px] leading-5 text-muted/90">{note}</p>
          <div className="grid grid-cols-2 gap-2">
            {secondaryAction}
            {primaryAction}
          </div>
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
