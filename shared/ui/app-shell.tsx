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
    <main className="app-safe-top app-safe-bottom relative mx-auto min-h-screen w-full max-w-7xl px-3 py-3 sm:px-5 sm:py-5 lg:px-8">
      <section className="overflow-hidden rounded-[36px] border border-white/90 bg-[#f8faf7] shadow-soft">
        <div className="app-safe-top sticky top-0 z-20 border-b border-black/6 bg-[#f7faf7] shadow-[0_10px_24px_rgba(19,33,29,0.05)]">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            {showBackButton ? <PageBackButton fallbackHref={backHref} label={backLabel} /> : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#17344f_0%,#1c5a4a_55%,#2f8b71_100%)] text-sm font-bold text-white shadow-[0_14px_28px_rgba(23,52,79,0.22)]">
                  报
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{title}</p>
                  <p className="truncate text-[11px] uppercase tracking-[0.24em] text-pine/80">{eyebrow}</p>
                </div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-black/6 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
              <span className="text-xs font-semibold text-muted">在线工作中</span>
            </div>
          </div>
        </div>

        <header className="relative flex flex-col gap-5 border-b border-black/6 bg-[radial-gradient(circle_at_top_right,_rgba(24,77,63,0.08),_transparent_30%),radial-gradient(circle_at_left_top,_rgba(23,52,79,0.06),_transparent_22%),linear-gradient(180deg,#ffffff_0%,#f7faf7_100%)] px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-pine ring-1 ring-pine/10 shadow-[0_10px_24px_rgba(19,33,29,0.04)]">
              <span className="h-2 w-2 rounded-full bg-pine/70" />
              {eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">{description}</p>
          </div>
          {actions ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-[440px] lg:justify-end">
              {actions}
            </div>
          ) : null}
        </header>

        <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">{children}</div>
      </section>
    </main>
  );
}
