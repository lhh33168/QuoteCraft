"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ProjectListActions } from "@/features/workspace/components/project-list-actions";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { formatMoney } from "@/shared/lib/format-money";
import type { BillingSnapshot } from "@/shared/types/billing";
import type { Project } from "@/shared/types/project";
import { AppShell } from "@/shared/ui/app-shell";
import { BillingLimitBanner } from "@/shared/ui/billing-limit-banner";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";
import { LanguageSwitcher } from "@/shared/ui/language-switcher";
import { MobileActionBar } from "@/shared/ui/mobile-action-bar";
import { StatusBadge } from "@/shared/ui/status-badge";

type WorkspacePageProps = {
  billingSnapshot?: BillingSnapshot | null;
  projects: Project[];
  notice?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

type WorkspaceActionState = "idle" | "create" | "template";

export function WorkspacePage({ billingSnapshot, projects, notice, searchValue, onSearchChange }: WorkspacePageProps) {
  const router = useRouter();
  const { t } = useI18n();
  const hasProjects = projects.length > 0;
  const isSearching = searchValue.trim().length > 0;
  const [actionState, setActionState] = useState<WorkspaceActionState>("idle");
  const createHref = "/projects/new" as Route;
  const templateHref = "/projects/new?template=education-site" as Route;
  const projectLimitReached =
    billingSnapshot?.usage.projectLimit !== null &&
    billingSnapshot &&
    billingSnapshot.usage.projectCount >= billingSnapshot.usage.projectLimit;

  useEffect(() => {
    router.prefetch(createHref);
    router.prefetch(templateHref);
  }, [createHref, router, templateHref]);

  function handleOpenCreate() {
    if (projectLimitReached) {
      router.push("/settings/billing");
      return;
    }

    setActionState("create");
    router.push(createHref);
  }

  function handleOpenTemplate() {
    if (projectLimitReached) {
      router.push("/settings/billing");
      return;
    }

    setActionState("template");
    router.push(templateHref);
  }

  return (
    <AppShell
      showBackButton={false}
      eyebrow={t("workspace.eyebrow")}
      topBarTitle={t("workspace.title")}
      topBarSubtitle={null}
      title={t("workspace.title")}
      description={t("workspace.description")}
      showHeader={false}
      showHeaderEyebrow={false}
      heroVariant="compact"
      mobileBottomBarSpacing={hasProjects ? "comfortable" : "compact"}
      topBarRight={<LanguageSwitcher compact />}
    >
      <div className="grid gap-6 pb-28 lg:grid-cols-[1.45fr_0.8fr] lg:gap-7 lg:pb-0">
        <section className="px-1 py-0.5 sm:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-[1.38rem] leading-[1.08] text-ink sm:text-[1.6rem]">
                {t("workspace.myProjects")}
              </h2>
            </div>

            <div className="w-full sm:max-w-sm">
              <label className="sr-only" htmlFor="workspace-search">
                {t("workspace.myProjects")}
              </label>
              <input
                className="w-full rounded-[16px] border border-black/8 bg-white/90 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-pine/30 focus:bg-white focus:ring-2 focus:ring-pine/8"
                id="workspace-search"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("workspace.searchPlaceholder")}
                value={searchValue}
              />
            </div>
          </div>

          {notice ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              {notice}
            </div>
          ) : null}

          {billingSnapshot ? <WorkspaceBillingStatusCard billingSnapshot={billingSnapshot} /> : null}
          {projectLimitReached ? (
            <div className="mt-4">
              <BillingLimitBanner
                actionLabel={t("workspace.goToSubscription")}
                description={t("workspace.projectLimitDescription")}
                href="/settings/billing"
                title={t("workspace.projectLimitTitle")}
              />
            </div>
          ) : null}

          {billingSnapshot?.isAdmin ? (
            <div className="mt-4 lg:hidden">
              <Link
                className="flex items-center justify-between gap-4 rounded-[22px] border border-[#17344f]/10 bg-[#17344f]/[0.04] px-4 py-3.5 shadow-[0_10px_24px_rgba(19,33,29,0.04)] transition active:scale-[0.995]"
                href="/settings/billing/admin"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#17344f]/72">
                    {t("workspace.adminShortcut")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink">{t("workspace.adminShortcutDescription")}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#17344f] px-3 py-1.5 text-xs font-semibold text-white">
                  {t("billing.adminEntry")}
                </span>
              </Link>
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            {hasProjects ? (
              projects.map((project) => <ProjectCard key={project.id} project={project} />)
            ) : (
              <EmptyState isSearching={isSearching} />
            )}
          </div>
        </section>

        <aside className="hidden space-y-5 lg:block">
          <section className="rounded-[26px] bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] p-5 text-white sm:rounded-[30px] sm:p-6">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              {t("workspace.today")}
            </div>
            <h2 className="mt-4 font-display text-[1.6rem] leading-[1.06] sm:text-[1.9rem]">
              {t("workspace.todayHeadline")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80">{t("workspace.todayDescription")}</p>
          </section>

          <section className="rounded-[24px] border border-white/80 bg-white/76 p-5 shadow-[0_18px_40px_rgba(19,33,29,0.05)] backdrop-blur-sm sm:rounded-[28px] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[1.35rem] leading-[1.08] text-ink sm:text-[1.55rem]">
                {t("workspace.quickActions")}
              </h2>
              <Link
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-black/8 bg-white px-3.5 text-[12px] font-semibold whitespace-nowrap text-muted transition hover:text-ink"
                href="/settings/billing"
              >
                {t("workspace.subscription")}
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold whitespace-nowrap text-white"
                onClick={handleOpenCreate}
                onFocus={() => router.prefetch(createHref)}
                onMouseEnter={() => router.prefetch(createHref)}
                onTouchStart={() => router.prefetch(createHref)}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={t("workspace.createQuote")}
                    loading={actionState === "create"}
                    loadingLabel={t("workspace.creatingProject")}
                  />
                </span>
              </button>

              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold whitespace-nowrap text-ink"
                onClick={handleOpenTemplate}
                onFocus={() => router.prefetch(templateHref)}
                onMouseEnter={() => router.prefetch(templateHref)}
                onTouchStart={() => router.prefetch(templateHref)}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <ButtonLoadingContent
                    idleLabel={t("workspace.createFromTemplate")}
                    loading={actionState === "template"}
                    loadingLabel={t("workspace.creatingProject")}
                    spinnerTone="dark"
                  />
                </span>
              </button>
            </div>
          </section>

          {billingSnapshot?.isAdmin ? (
            <section className="rounded-[24px] border border-[#17344f]/10 bg-[#17344f]/[0.04] p-5 shadow-[0_18px_40px_rgba(19,33,29,0.04)] sm:rounded-[28px] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#17344f]/70">
                    {t("workspace.adminShortcut")}
                  </p>
                  <h2 className="mt-3 font-display text-[1.28rem] leading-[1.08] text-ink">
                    {t("billing.adminTitle")}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted">{t("workspace.adminShortcutDescription")}</p>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#17344f] px-4 text-sm font-semibold text-white"
                  href="/settings/billing/admin"
                >
                  {t("billing.adminEntry")}
                </Link>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <MobileActionBar
        className="shadow-[0_-10px_28px_rgba(19,33,29,0.08)]"
        primaryAction={
          <button
            className="inline-flex items-center justify-center rounded-[18px] bg-pine px-4 text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(24,77,63,0.16)]"
            onClick={handleOpenCreate}
            onFocus={() => router.prefetch(createHref)}
            onMouseEnter={() => router.prefetch(createHref)}
            onTouchStart={() => router.prefetch(createHref)}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("workspace.createProject")}
                loading={actionState === "create"}
                loadingLabel={t("workspace.creatingProject")}
              />
            </span>
          </button>
        }
        secondaryAction={
          <button
            className="inline-flex items-center justify-center rounded-[18px] border border-black/8 bg-white/94 px-4 text-[15px] font-semibold text-ink shadow-[0_8px_18px_rgba(19,33,29,0.05)]"
            onClick={handleOpenTemplate}
            onFocus={() => router.prefetch(templateHref)}
            onMouseEnter={() => router.prefetch(templateHref)}
            onTouchStart={() => router.prefetch(templateHref)}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("workspace.template")}
                loading={actionState === "template"}
                loadingLabel={t("workspace.creatingProject")}
                spinnerTone="dark"
              />
            </span>
          </button>
        }
      />
    </AppShell>
  );
}

function WorkspaceBillingStatusCard({ billingSnapshot }: { billingSnapshot: BillingSnapshot }) {
  const { t } = useI18n();
  const effectivePlan = billingSnapshot.effectivePlan ?? billingSnapshot.plan;
  const subscriptionPlan = billingSnapshot.subscriptionPlan ?? billingSnapshot.plan;
  const status = billingSnapshot.lifecycleStatus ?? "inactive";

  if (effectivePlan === "free" && subscriptionPlan === "free") {
    return null;
  }

  const title =
    status === "expired"
      ? t("workspace.billingStatusExpired")
      : status === "inactive"
        ? t("workspace.billingStatusInactive")
        : effectivePlan === "pro"
          ? t("workspace.billingStatusPro")
          : t("workspace.billingStatusFree");

  const hint =
    status === "expired"
      ? t("workspace.billingStatusHintExpired")
      : status === "inactive"
        ? t("workspace.billingStatusHintInactive")
        : billingSnapshot.expiresAt
          ? t("workspace.billingStatusExpiry", {
              date: formatUpdatedAt(billingSnapshot.expiresAt, billingSnapshot.expiresAt)
            })
          : null;

  return (
    <Link
      className="mt-4 flex items-start justify-between gap-4 rounded-[22px] border border-amber-200/70 bg-amber-50/80 px-4 py-3.5 shadow-[0_10px_24px_rgba(19,33,29,0.04)] transition active:scale-[0.995]"
      href="/settings/billing"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700/82">
          {t("workspace.subscription")}
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink">{title}</p>
        {hint ? <p className="mt-1 text-sm leading-6 text-muted">{hint}</p> : null}
      </div>
      <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-700">
        {t("workspace.subscription")}
      </span>
    </Link>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [navState, setNavState] = useState<"idle" | "edit" | "share">("idle");
  const [isCopyPending, startCopyTransition] = useTransition();
  const editHref = `/projects/${project.id}` as Route;
  const shareHref = `/projects/${project.id}/share` as Route;

  const projectTypeLabelMap: Record<Project["projectType"], string> = {
    website: t("projectCard.website"),
    mini_program: t("projectCard.miniProgram"),
    admin_panel: t("projectCard.adminPanel"),
    custom: t("projectCard.custom")
  };

  function prefetchProjectRoutes() {
    router.prefetch(editHref);
    router.prefetch(shareHref);
  }

  async function ensureShareUrl() {
    const response = await fetch(`/api/projects/${project.id}/share`, {
      method: "POST"
    });
    const data = (await response.json()) as {
      shareUrl?: string;
      error?: string;
      code?: string;
    };

    if (!response.ok || !data.shareUrl) {
      throw new Error(data.code === "SHARE_DISABLED" ? t("projectCard.shareDisabled") : (data.error ?? t("projectCard.shareLinkGenerateFailed")));
    }

    return new URL(data.shareUrl, window.location.origin).toString();
  }

  function handleOpenEditor() {
    setNavState("edit");
    setMessage(t("projectCard.openingEditor"));
    router.push(editHref);
  }

  function handleOpenSharePage() {
    setNavState("share");
    setMessage(t("projectCard.openingCustomerPage"));
    window.open(shareHref, "_blank", "noopener,noreferrer");
  }

  function handleCopyShareLink() {
    startCopyTransition(async () => {
      setMessage(t("projectCard.generatingShareLink"));

      try {
        const shareUrl = await ensureShareUrl();
        await navigator.clipboard.writeText(shareUrl);
        setMessage(t("projectCard.shareLinkCopied"));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : t("projectCard.shareLinkFailed"));
      }
    });
  }

  return (
    <article className="rounded-[22px] border border-black/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(252,250,245,0.9))] p-4 shadow-[0_12px_28px_rgba(19,33,29,0.035)] transition hover:-translate-y-0.5 sm:rounded-[24px] sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink">{project.title}</h3>
          <p className="mt-2 text-sm text-muted">
            {project.clientName} · {formatUpdatedAt(project.updatedAt, t("workspace.justUpdated"))}
          </p>
        </div>

        <StatusBadge tone={project.status}>
          {project.status === "draft"
            ? t("projectCard.draft")
            : project.status === "generated"
              ? t("projectCard.generated")
              : t("projectCard.shared")}
        </StatusBadge>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          {t("projectCard.projectType")}
          {projectTypeLabelMap[project.projectType]}
        </span>
        <strong className="font-display text-2xl text-pine">{formatMoney(project.totalPrice)}</strong>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold whitespace-nowrap text-white"
          onClick={handleOpenEditor}
          onFocus={prefetchProjectRoutes}
          onMouseEnter={prefetchProjectRoutes}
          onTouchStart={prefetchProjectRoutes}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <ButtonLoadingContent
              idleLabel={t("projectCard.continueEditing")}
              loading={navState === "edit"}
              loadingLabel={t("workspace.creatingProject")}
            />
          </span>
        </button>

        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold whitespace-nowrap text-ink"
          onClick={handleOpenSharePage}
          onFocus={prefetchProjectRoutes}
          onMouseEnter={prefetchProjectRoutes}
          onTouchStart={prefetchProjectRoutes}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <ButtonLoadingContent
              idleLabel={t("projectCard.openCustomerPage")}
              loading={navState === "share"}
              loadingLabel={t("workspace.creatingProject")}
              spinnerTone="dark"
            />
          </span>
        </button>

        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold whitespace-nowrap text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
          disabled={isCopyPending}
          onClick={handleCopyShareLink}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <ButtonLoadingContent
              idleLabel={t("projectCard.copyShareLink")}
              loading={isCopyPending}
              loadingLabel={t("common.processing")}
              spinnerTone="dark"
            />
          </span>
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
  const { t } = useI18n();

  return (
    <div className="rounded-[24px] border border-black/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(250,248,242,0.5))] px-5 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:rounded-[26px] sm:px-6 sm:py-8">
      <h3 className="text-lg font-semibold text-ink">
        {isSearching ? t("workspace.emptySearchTitle") : t("workspace.emptyTitle")}
      </h3>
      <p className="mx-auto mt-3 max-w-[24rem] text-sm leading-7 text-muted">
        {isSearching ? t("workspace.emptySearchDescription") : t("workspace.emptyDescription")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-6 text-sm font-semibold whitespace-nowrap text-white"
          href="/projects/new"
        >
          {t("workspace.createProject")}
        </Link>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/8 bg-white/92 px-6 text-sm font-semibold whitespace-nowrap text-ink"
          href="/projects/new?template=education-site"
        >
          {t("workspace.useTemplate")}
        </Link>
      </div>
    </div>
  );
}

function formatUpdatedAt(value: string, fallbackLabel: string) {
  if (!value) {
    return fallbackLabel;
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
