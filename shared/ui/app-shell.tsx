import type { Route } from "next";
import { PageBackButton } from "@/shared/ui/page-back-button";

type AppShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
  backHref?: Route;
  backLabel?: string;
  showBackButton?: boolean;
};

export function AppShell({
  title,
  description,
  children,
  actions,
  eyebrow = "报价助手",
  backHref = "/" as Route,
  backLabel = "返回上一页",
  showBackButton = true
}: AppShellProps) {
  return (
    <main className="relative mx-auto min-h-screen w-full max-w-7xl px-3 py-3 sm:px-5 sm:py-5 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-white/75 bg-white/72 shadow-soft backdrop-blur">
        <div className="sticky top-0 z-20 border-b border-black/6 bg-white/82 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            {showBackButton ? <PageBackButton fallbackHref={backHref} label={backLabel} /> : null}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-pine">报价助手</p>
              <p className="truncate text-sm font-semibold text-ink">{title}</p>
            </div>
            <div className="hidden rounded-full border border-black/6 bg-white/80 px-3 py-2 text-xs font-semibold text-muted sm:inline-flex">
              移动端工作台
            </div>
          </div>
        </div>

        <header className="relative flex flex-col gap-5 border-b border-black/5 bg-[radial-gradient(circle_at_top_right,_rgba(24,77,63,0.1),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.58)_100%)] px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-pine/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pine">
              {eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">{description}</p>
          </div>
          {actions ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-[420px] lg:justify-end">
              {actions}
            </div>
          ) : null}
        </header>

        <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">{children}</div>
      </section>
    </main>
  );
}
