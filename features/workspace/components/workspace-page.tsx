"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ProjectListActions } from "@/features/workspace/components/project-list-actions";
import { formatMoney } from "@/shared/lib/format-money";
import type { Project } from "@/shared/types/project";
import { AppShell } from "@/shared/ui/app-shell";
import { StatusBadge } from "@/shared/ui/status-badge";

type WorkspacePageProps = {
  projects: Project[];
  notice?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

const projectTypeLabelMap: Record<Project["projectType"], string> = {
  website: "官网开发",
  mini_program: "小程序开发",
  admin_panel: "后台管理系统",
  custom: "定制项目"
};

export function WorkspacePage({ projects, notice, searchValue, onSearchChange }: WorkspacePageProps) {
  const hasProjects = projects.length > 0;
  const isSearching = searchValue.trim().length > 0;

  return (
    <AppShell
      showBackButton={false}
      backHref="/"
      backLabel="返回上一页"
      eyebrow="项目工作台"
      title="项目工作台"
      description="优先展示待推进的方案、项目列表和快捷动作，让整个报价推进过程更顺手。"
      actions={
        <>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink"
            href="/settings/billing"
          >
            查看订阅
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold whitespace-nowrap text-white"
            href="/projects/new"
          >
            新建项目
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-[28px] border border-white/80 bg-white/80 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl text-ink">我的项目</h2>
              <p className="mt-2 text-sm leading-7 text-muted">从这里继续编辑、分享，或者复用历史项目。</p>
            </div>
            <div className="w-full sm:max-w-xs">
              <label className="sr-only" htmlFor="workspace-search">
                搜索项目
              </label>
              <input
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine/40 focus:ring-2 focus:ring-pine/10"
                id="workspace-search"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="搜索项目名称 / 客户 / 公司 / 类型"
                value={searchValue}
              />
            </div>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{notice}</div>
          ) : null}

          <div className="mt-6 space-y-4">
            {hasProjects ? (
              projects.map((project) => <ProjectCard key={project.id} project={project} />)
            ) : (
              <EmptyState isSearching={isSearching} />
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] p-6 text-white">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Today
            </div>
            <h2 className="mt-4 font-display text-4xl leading-none">下午 4 点前完成 2 份方案</h2>
            <p className="mt-4 text-sm leading-7 text-white/80">
              当前有 1 个客户待分享，2 个历史项目待复用。先把报价发出去，再继续润色方案。
            </p>
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white/80 p-6">
            <h2 className="font-display text-3xl text-ink">快捷动作</h2>
            <div className="mt-5 grid gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold whitespace-nowrap text-white"
                href="/projects/new"
              >
                创建新报价
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink"
                href="/projects/new?template=education-site"
              >
                基于示例创建
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isCopyPending, startCopyTransition] = useTransition();

  async function ensureShareUrl() {
    const response = await fetch(`/api/projects/${project.id}/share`, {
      method: "POST"
    });
    const data = (await response.json()) as {
      shareUrl?: string;
      error?: string;
    };

    if (!response.ok || !data.shareUrl) {
      throw new Error(data.error ?? "生成分享链接失败。");
    }

    return new URL(data.shareUrl, window.location.origin).toString();
  }

  function handleOpenSharePage() {
    setMessage("正在打开客户页...");
    window.open(`/projects/${project.id}/share`, "_blank", "noopener,noreferrer");
  }

  function handleCopyShareLink() {
    startCopyTransition(async () => {
      setMessage("正在生成分享链接...");

      try {
        const shareUrl = await ensureShareUrl();
        await navigator.clipboard.writeText(shareUrl);
        setMessage("分享链接已复制到剪贴板。");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "复制分享链接失败，请稍后重试。");
      }
    });
  }

  return (
    <article className="rounded-[24px] border border-black/5 bg-[#fcfaf5] p-5 transition hover:-translate-y-0.5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink">{project.title}</h3>
          <p className="mt-2 text-sm text-muted">
            {project.clientName} · {formatUpdatedAt(project.updatedAt)}
          </p>
        </div>
        <StatusBadge tone={project.status}>
          {project.status === "draft" ? "草稿" : project.status === "generated" ? "已生成" : "已分享"}
        </StatusBadge>
      </div>
      <div className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>项目类型：{projectTypeLabelMap[project.projectType]}</span>
        <strong className="font-display text-2xl text-pine">{formatMoney(project.totalPrice)}</strong>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold whitespace-nowrap text-white"
          href={`/projects/${project.id}`}
        >
          继续编辑
        </Link>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold whitespace-nowrap text-ink"
          onClick={handleOpenSharePage}
          type="button"
        >
          查看客户页
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
          disabled={isCopyPending}
          onClick={handleCopyShareLink}
          type="button"
        >
          {isCopyPending ? "正在复制..." : "复制分享链接"}
        </button>
      </div>
      <div className="mt-4">
        <ProjectListActions projectId={project.id} />
      </div>
      {message ? <p className="mt-3 text-xs leading-6 text-muted">{message}</p> : null}
    </article>
  );
}

function EmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <div className="rounded-[24px] border border-dashed border-black/10 bg-white/70 px-5 py-8 text-center">
      <h3 className="text-lg font-semibold text-ink">{isSearching ? "没有找到匹配项目" : "还没有项目"}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">
        {isSearching ? "试试更换关键词，或者用客户名、公司名、项目类型继续搜索。" : "从一个新项目开始，或者先基于示例创建一份方案。"}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold whitespace-nowrap text-white"
          href="/projects/new"
        >
          新建项目
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold whitespace-nowrap text-ink"
          href="/projects/new?template=education-site"
        >
          使用示例模板
        </Link>
      </div>
    </div>
  );
}

function formatUpdatedAt(value: string) {
  if (!value) {
    return "刚刚更新";
  }

  if (value.includes("今天") || value.includes("昨天")) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
