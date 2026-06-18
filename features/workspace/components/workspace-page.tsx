import Link from "next/link";
import { AppShell } from "@/shared/ui/app-shell";
import { StatusBadge } from "@/shared/ui/status-badge";
import { formatMoney } from "@/shared/lib/format-money";
import type { Project } from "@/shared/types/project";

type WorkspacePageProps = {
  projects: Project[];
};

const projectTypeLabelMap: Record<Project["projectType"], string> = {
  website: "官网开发",
  mini_program: "小程序开发",
  admin_panel: "管理后台",
  custom: "定制项目"
};

export function WorkspacePage({ projects }: WorkspacePageProps) {
  return (
    <AppShell
      title="项目工作台"
      description="优先展示待推进的方案、项目列表和快捷动作，保持移动端业务工作流足够短。"
      actions={
        <>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
            href="/settings/billing"
          >
            查看订阅
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-white"
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
              <p className="mt-2 text-sm leading-7 text-muted">从这里继续编辑、分享或复制历史项目。</p>
            </div>
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none sm:max-w-xs"
              defaultValue="搜索项目名称 / 客户 / 项目类型"
            />
          </div>

          <div className="mt-6 space-y-4">
            {projects.map((project) => (
              <article
                className="rounded-[24px] border border-black/5 bg-[#fcfaf5] p-5 transition hover:-translate-y-0.5"
                key={project.id}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{project.title}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {project.clientName} · {formatUpdatedAt(project.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge tone={project.status}>
                    {project.status === "draft"
                      ? "草稿"
                      : project.status === "generated"
                        ? "已生成"
                        : "已分享"}
                  </StatusBadge>
                </div>
                <div className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
                  <span>项目类型：{projectTypeLabelMap[project.projectType]}</span>
                  <strong className="font-display text-2xl text-pine">{formatMoney(project.totalPrice)}</strong>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold text-white"
                    href={`/projects/${project.id}`}
                  >
                    继续编辑
                  </Link>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
                    href={`/share/share-${project.id}`}
                  >
                    查看客户页
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] p-6 text-white">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Today
            </div>
            <h2 className="mt-4 font-display text-4xl leading-none">下午 4 点前完成 2 份方案</h2>
            <p className="mt-4 text-sm leading-7 text-white/80">
              当前有 1 个客户待分享，1 个历史项目待复用。先做报价，再做润色。
            </p>
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white/80 p-6">
            <h2 className="font-display text-3xl text-ink">快捷动作</h2>
            <div className="mt-5 grid gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-white"
                href="/projects/new"
              >
                创建新报价
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
                href="/projects/project-education-site"
              >
                继续编辑示例
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
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
