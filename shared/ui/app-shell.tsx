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
      <section className="overflow-hidden rounded-[34px] border border-black/5 bg-[#f8faf6] shadow-[0_24px_70px_rgba(19,33,29,0.08)]">
        <div className="app-safe-top sticky top-0 z-20 border-b border-black/6 bg-[linear-gradient(180deg,#f9fbf8_0%,#f4f8f4_100%)] shadow-[0_10px_24px_rgba(19,33,29,0.04)]">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            {showBackButton ? (
              <div className="shrink-0">
                <PageBackButton fallbackHref={backHref} label={backLabel} />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#18374d_0%,#1c5d4b_58%,#2c876d_100%)] text-sm font-bold text-white shadow-[0_14px_26px_rgba(23,52,79,0.18)]">
                  报
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink sm:text-base">{title}</p>
                  <p className="truncate text-[12px] tracking-[0.28em] text-pine/75">{eyebrow}</p>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-black/6 bg-white/92 px-3 py-2 shadow-[0_8px_18px_rgba(19,33,29,0.04)] sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
              <span className="text-xs font-semibold text-muted">在线工作中</span>
            </div>
          </div>
        </div>

        <header className="relative flex flex-col gap-5 border-b border-black/6 bg-[radial-gradient(circle_at_top_right,_rgba(24,77,63,0.08),_transparent_30%),radial-gradient(circle_at_left_top,_rgba(23,52,79,0.05),_transparent_20%),linear-gradient(180deg,#ffffff_0%,#f7faf7_100%)] px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine/10 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-pine shadow-[0_10px_24px_rgba(19,33,29,0.04)]">
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
