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
  mobileBottomBarSpacing?: "default" | "compact" | "comfortable";
};

export function AppShell({
  title,
  description,
  children,
  actions,
  eyebrow = "报价助手",
  backHref = "/" as Route,
  backLabel = "返回上一页",
  showBackButton = true,
  mobileBottomBarSpacing = "default"
}: AppShellProps) {
  return (
    <main className="app-safe-bottom relative mx-auto min-h-screen w-full max-w-7xl pb-2 sm:px-5 sm:py-5 lg:px-8">
      <div className="app-safe-top app-top-bar app-top-bar-soft sticky top-0 z-30 mb-3 sm:mb-4">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 py-3 sm:grid-cols-[48px_minmax(0,1fr)_48px]">
            {showBackButton ? (
              <div className="shrink-0">
                <PageBackButton fallbackHref={backHref} label={backLabel} />
              </div>
            ) : (
              <div />
            )}

            <div className="min-w-0 text-center">
              <p className="truncate text-[16px] font-semibold text-ink sm:text-[18px]">{title}</p>
              <p className="mt-0.5 truncate text-[11px] tracking-[0.18em] text-muted">{eyebrow}</p>
            </div>

            <div aria-hidden="true" className="h-11 w-11 sm:h-12 sm:w-12" />
          </div>
        </div>
      </div>

      <section className="mx-2 overflow-hidden rounded-[30px] border border-black/5 bg-[#f8faf6] shadow-[0_24px_70px_rgba(19,33,29,0.08)] sm:mx-0 sm:rounded-[34px]">
        <header className="relative flex flex-col gap-4 border-b border-black/6 bg-[radial-gradient(circle_at_top_right,_rgba(24,77,63,0.08),_transparent_30%),radial-gradient(circle_at_left_top,_rgba(23,52,79,0.05),_transparent_20%),linear-gradient(180deg,#ffffff_0%,#f7faf7_100%)] px-3 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine/10 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-pine shadow-[0_10px_24px_rgba(19,33,29,0.04)]">
              <span className="h-2 w-2 rounded-full bg-pine/70" />
              {eyebrow}
            </div>
            <h1 className="mt-2.5 max-w-3xl font-display text-[2rem] leading-[1.08] text-ink sm:text-[3.2rem]">{title}</h1>
            <p className="mt-2.5 max-w-3xl text-sm leading-7 text-muted sm:text-base">{description}</p>
          </div>

          {actions ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-[440px] lg:justify-end">
              {actions}
            </div>
          ) : null}
        </header>

        <div
          className={[
            "px-3 pt-3 sm:px-6 sm:pt-5",
            mobileBottomBarSpacing === "comfortable"
              ? "pb-32 sm:pb-36 lg:pb-6"
              : mobileBottomBarSpacing === "compact"
                ? "pb-20 sm:pb-24 lg:pb-6"
                : "pb-3 sm:pb-6"
          ].join(" ")}
        >
          {children}
        </div>
      </section>
    </main>
  );
}
