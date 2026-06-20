import type { Route } from "next";
import { PageBackButton } from "@/shared/ui/page-back-button";

type AppShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  topBarRight?: React.ReactNode;
  eyebrow?: string;
  topBarTitle?: string;
  topBarSubtitle?: string | null;
  backHref?: Route;
  backLabel?: string;
  showBackButton?: boolean;
  showHeader?: boolean;
  showHeaderEyebrow?: boolean;
  heroVariant?: "default" | "compact";
  mobileBottomBarSpacing?: "default" | "compact" | "comfortable";
};

export function AppShell({
  title,
  description,
  children,
  actions,
  topBarRight,
  eyebrow = "报价助手",
  topBarTitle,
  topBarSubtitle,
  backHref = "/" as Route,
  backLabel = "返回上一页",
  showBackButton = true,
  showHeader = true,
  showHeaderEyebrow = true,
  heroVariant = "default",
  mobileBottomBarSpacing = "default"
}: AppShellProps) {
  const resolvedTopBarTitle = topBarTitle ?? title;
  const resolvedTopBarSubtitle = topBarSubtitle === undefined ? (showBackButton ? eyebrow : null) : topBarSubtitle;
  const isCompactHero = heroVariant === "compact";

  return (
    <main className="app-safe-bottom relative mx-auto min-h-screen w-full max-w-7xl pb-2 sm:px-5 sm:py-5 lg:px-8">
      <div className="app-safe-top app-top-bar app-top-bar-soft sticky top-0 z-30 mb-3 sm:mb-4">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          {showBackButton ? (
            <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 py-2.5 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:py-3">
              <div className="shrink-0">
                <PageBackButton fallbackHref={backHref} label={backLabel} />
              </div>

              <div className="min-w-0 text-center">
                <p className="truncate text-[15px] font-semibold text-ink sm:text-[17px]">{resolvedTopBarTitle}</p>
                {resolvedTopBarSubtitle ? (
                  <p className="mt-0.5 truncate text-[10px] tracking-[0.16em] text-muted">{resolvedTopBarSubtitle}</p>
                ) : null}
              </div>

              <div className="flex min-w-[44px] justify-end sm:min-w-[48px]">{topBarRight}</div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 py-3 sm:py-3.5">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink sm:text-[17px]">{resolvedTopBarTitle}</p>
                {resolvedTopBarSubtitle ? (
                  <p className="mt-0.5 truncate text-[10px] tracking-[0.16em] text-muted">{resolvedTopBarSubtitle}</p>
                ) : null}
              </div>
              <div className="shrink-0">{topBarRight}</div>
            </div>
          )}
        </div>
      </div>

      <section className="mx-2 overflow-hidden rounded-[30px] border border-black/5 bg-[#f8faf6] shadow-[0_24px_70px_rgba(19,33,29,0.08)] sm:mx-0 sm:rounded-[34px]">
        {showHeader ? (
          <header
            className={[
              "relative flex flex-col border-b border-black/6 bg-[radial-gradient(circle_at_top_right,_rgba(24,77,63,0.08),_transparent_30%),radial-gradient(circle_at_left_top,_rgba(23,52,79,0.05),_transparent_20%),linear-gradient(180deg,#ffffff_0%,#f7faf7_100%)] px-3 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6",
              isCompactHero ? "gap-3 py-3.5 sm:py-4.5" : "gap-4 py-4 sm:py-5"
            ].join(" ")}
          >
            <div className="max-w-3xl">
              {showHeaderEyebrow ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-pine/10 bg-white px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-pine shadow-[0_10px_24px_rgba(19,33,29,0.04)]">
                  <span className="h-2 w-2 rounded-full bg-pine/70" />
                  {eyebrow}
                </div>
              ) : null}
              <h1
                className={[
                  "max-w-3xl font-display leading-[1.08] text-ink",
                  showHeaderEyebrow ? "mt-2.5" : "",
                  isCompactHero ? "text-[1.32rem] sm:text-[1.6rem] lg:text-[1.9rem]" : "text-[1.58rem] sm:text-[2.15rem] lg:text-[2.45rem]"
                ].join(" ")}
              >
                {title}
              </h1>
              <p
                className={[
                  "max-w-3xl text-muted",
                  isCompactHero ? "mt-1.5 text-[13px] leading-6 sm:text-[14px]" : "mt-2 text-[14px] leading-7 sm:text-[15px]"
                ].join(" ")}
              >
                {description}
              </p>
            </div>

            {actions ? (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-[440px] lg:justify-end">
                {actions}
              </div>
            ) : null}
          </header>
        ) : null}

        <div
          className={[
            showHeader ? "px-3 pt-3 sm:px-6 sm:pt-5" : "px-3 py-3 sm:px-6 sm:py-5",
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
