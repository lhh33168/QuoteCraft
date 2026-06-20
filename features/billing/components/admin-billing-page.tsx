"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useState, useTransition } from "react";
import { fetchAdminUpgradeRequests } from "@/features/billing/lib/fetch-admin-upgrade-requests";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format-datetime";
import type { BillingOrder, BillingUpgradeRequest } from "@/shared/types/billing";
import { AppShell } from "@/shared/ui/app-shell";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";

type AdminBillingFilter = "all" | "pending" | "approved" | "rejected" | "expired" | "expiring_soon";

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

export function AdminBillingPage() {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [filter, setFilter] = useState<AdminBillingFilter>("pending");
  const [orderReviewNote, setOrderReviewNote] = useState<Record<string, string>>({});
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-billing-requests"],
    queryFn: fetchAdminUpgradeRequests
  });

  const items = data?.items ?? [];
  const orders = data?.orders ?? [];
  const orderStatusLabel = (status: BillingOrder["status"]) => getOrderStatusLabel(t, status);
  const now = Date.now();
  const upcomingWindow = now + 7 * 24 * 60 * 60 * 1000;
  const summary = {
    total: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
    expired: items.filter((item) => item.lifecycleStatus === "expired").length,
    expiringSoon: items.filter((item) => {
      if (!item.expiresAt || item.lifecycleStatus === "expired") {
        return false;
      }

      const expiresAt = new Date(item.expiresAt).getTime();

      return !Number.isNaN(expiresAt) && expiresAt > now && expiresAt <= upcomingWindow;
    }).length
  };
  const filteredItems = items
    .filter((item) => {
      if (filter === "all") {
        return true;
      }

      if (filter === "expired") {
        return item.lifecycleStatus === "expired";
      }

      if (filter === "expiring_soon") {
        if (!item.expiresAt || item.lifecycleStatus === "expired") {
          return false;
        }

        const expiresAt = new Date(item.expiresAt).getTime();

        return !Number.isNaN(expiresAt) && expiresAt > now && expiresAt <= upcomingWindow;
      }

      return item.status === filter;
    })
    .sort((left, right) => {
      if (filter === "expired" || filter === "expiring_soon") {
        return new Date(left.expiresAt ?? left.createdAt).getTime() - new Date(right.expiresAt ?? right.createdAt).getTime();
      }

      if (left.status === "pending" && right.status !== "pending") {
        return -1;
      }

      if (left.status !== "pending" && right.status === "pending") {
        return 1;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  function runManagedAction(actionKeyValue: string, runner: () => Promise<void>) {
    startTransition(async () => {
      setActionKey(actionKeyValue);
      setFeedback(null);

      try {
        await runner();
      } catch (error) {
        setFeedback({
          tone: "error",
          message: error instanceof Error ? error.message : t("billing.adminLifecycleFailed")
        });
      } finally {
        setActionKey(null);
      }
    });
  }

  function handleReview(item: BillingUpgradeRequest, status: "approved" | "rejected") {
    startTransition(async () => {
      setActionKey(`${item.id}:${status}`);
      setFeedback(null);

      try {
        const response = await fetch("/api/admin/billing", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requestId: item.id,
            status
          })
        });
        const result = (await response.json()) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          setFeedback({
            tone: "error",
            message: result.error ?? t("billing.adminReviewFailed")
          });
          return;
        }

        const accountLabel = item.email || t("billing.unknownUser");
        setFeedback({
          tone: "success",
          message:
            status === "approved"
              ? t("billing.adminApprovedMessage", { email: accountLabel })
              : t("billing.adminRejectedMessage", { email: accountLabel })
        });
        await refetch();
      } catch {
        setFeedback({
          tone: "error",
          message: t("billing.adminReviewFailed")
        });
      } finally {
        setActionKey(null);
      }
    });
  }

  function handlePlanChange(item: BillingUpgradeRequest, targetPlan: "free" | "pro") {
    startTransition(async () => {
      if (!item.userId) {
        setFeedback({
          tone: "error",
          message: t("billing.adminPlanChangeUserMissing")
        });
        return;
      }

      setActionKey(`${item.userId}:${targetPlan}`);
      setFeedback(null);

      try {
        const response = await fetch("/api/admin/billing", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "change_plan",
            userId: item.userId,
            targetPlan
          })
        });
        const result = (await response.json()) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          setFeedback({
            tone: "error",
            message: result.error ?? t("billing.adminPlanChangeFailed")
          });
          return;
        }

        setFeedback({
          tone: "success",
          message: result.message ?? t("billing.adminPlanChangeSuccess")
        });
        await refetch();
      } catch {
        setFeedback({
          tone: "error",
          message: t("billing.adminPlanChangeFailed")
        });
      } finally {
        setActionKey(null);
      }
    });
  }

  function handleLifecycle(item: BillingUpgradeRequest, payload: {
    targetPlan: "free" | "pro";
    lifecycleStatus: "active" | "expired" | "inactive";
  }) {
    startTransition(async () => {
      if (!item.userId) {
        setFeedback({
          tone: "error",
          message: t("billing.adminPlanChangeUserMissing")
        });
        return;
      }

      setActionKey(`${item.userId}:${payload.targetPlan}:${payload.lifecycleStatus}`);
      setFeedback(null);

      try {
        const response = await fetch("/api/admin/billing", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "update_lifecycle",
            userId: item.userId,
            targetPlan: payload.targetPlan,
            lifecycleStatus: payload.lifecycleStatus
          })
        });
        const result = (await response.json()) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          setFeedback({
            tone: "error",
            message: result.error ?? t("billing.adminLifecycleFailed")
          });
          return;
        }

        setFeedback({
          tone: "success",
          message: result.message ?? t("billing.adminLifecycleSuccess")
        });
        await refetch();
      } catch {
        setFeedback({
          tone: "error",
          message: t("billing.adminLifecycleFailed")
        });
      } finally {
        setActionKey(null);
      }
    });
  }

  function handleOrderReview(order: BillingOrder, status: BillingOrder["status"]) {
    runManagedAction(`order:${order.id}:${status}`, async () => {
      const response = await fetch("/api/admin/billing", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "review_order",
          orderId: order.id,
          orderStatus: status,
          reviewedNote: orderReviewNote[order.id] ?? ""
        })
      });
      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? t("billing.adminReviewFailed"));
      }

      await refetch();
      setFeedback({
        tone: "success",
        message: t("billing.adminReviewSuccess")
      });
    });
  }

  return (
    <AppShell
      backHref="/workspace"
      backLabel={t("billing.backToWorkspace")}
      eyebrow={t("billing.adminEyebrow")}
      title={t("billing.adminTitle")}
      description={t("billing.adminDescription")}
      heroVariant="compact"
    >
      {isLoading ? (
        <section className="rounded-[28px] border border-white/80 bg-white/85 p-6 text-sm text-muted">
          {t("billing.loading")}
        </section>
      ) : error ? (
        <section className="rounded-[28px] border border-red-100 bg-red-50/90 p-6 text-sm leading-7 text-red-700">
          {error instanceof Error ? error.message : t("billing.adminLoadFailed")}
        </section>
      ) : (
        <div className="space-y-5">
          {feedback ? (
            <div
              className={cn(
                "rounded-[22px] px-4 py-3 text-sm leading-7",
                feedback.tone === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              )}
            >
              {feedback.message}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <SummaryCard label={t("billing.adminStatsPending")} value={summary.pending} tone="pending" />
            <SummaryCard label={t("billing.adminStatsApproved")} value={summary.approved} tone="approved" />
            <SummaryCard label={t("billing.adminStatsRejected")} value={summary.rejected} tone="rejected" />
            <SummaryCard label={t("billing.adminStatsTotal")} value={summary.total} tone="neutral" />
            <SummaryCard label={t("billing.adminStatsExpired")} value={summary.expired} tone="rejected" />
            <SummaryCard label={t("billing.adminStatsExpiringSoon")} value={summary.expiringSoon} tone="pending" />
          </section>

          <section className="rounded-[24px] border border-white/80 bg-white/85 p-3 shadow-[0_18px_40px_rgba(19,33,29,0.04)]">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filter === "pending"}
                label={t("billing.adminFilterPending")}
                onClick={() => setFilter("pending")}
              />
              <FilterButton
                active={filter === "approved"}
                label={t("billing.adminFilterApproved")}
                onClick={() => setFilter("approved")}
              />
              <FilterButton
                active={filter === "rejected"}
                label={t("billing.adminFilterRejected")}
                onClick={() => setFilter("rejected")}
              />
              <FilterButton
                active={filter === "all"}
                label={t("billing.adminFilterAll")}
                onClick={() => setFilter("all")}
              />
              <FilterButton
                active={filter === "expired"}
                label={t("billing.adminFilterExpired")}
                onClick={() => setFilter("expired")}
              />
              <FilterButton
                active={filter === "expiring_soon"}
                label={t("billing.adminFilterExpiringSoon")}
                onClick={() => setFilter("expiring_soon")}
              />
            </div>
          </section>

          {filteredItems.length ? (
            filteredItems.map((item) => (
              <UpgradeRequestCard
                item={item}
                key={item.id}
                loadingAction={actionKey}
                onAction={runManagedAction}
                onLifecycleChange={handleLifecycle}
                onPlanChange={handlePlanChange}
                onRefresh={refetch}
                onReview={handleReview}
              />
            ))
          ) : (
            <section className="rounded-[28px] border border-white/80 bg-white/85 p-6 text-sm text-muted">
              {summary.total ? t("billing.adminFilterEmpty") : t("billing.adminEmpty")}
            </section>
          )}

          {orders.length ? (
            <section className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-[0_18px_40px_rgba(19,33,29,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.4rem] leading-[1.08] text-ink">{t("billing.adminOrdersTitle")}</h2>
                <span className="rounded-full bg-[#f7f4ee] px-3 py-1 text-xs font-semibold text-muted">
                  {orders.length}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {orders.map((order) => (
                  <article className="rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4" key={order.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-ink">
                          {getPlanLabel(t, order.currentPlan)} -&gt; {getPlanLabel(t, order.targetPlan)}
                        </p>
                        <p className="text-xs leading-6 text-muted">
                          {t("billing.adminOrderCreatedAt")}
                          {formatDateTime(order.createdAt)}
                        </p>
                        {order.updatedAt ? (
                          <p className="text-xs leading-6 text-muted">
                            {t("billing.adminOrderUpdatedAt")}
                            {formatDateTime(order.updatedAt)}
                          </p>
                        ) : null}
                      </div>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getOrderStatusTone(order.status))}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm leading-7 text-muted sm:grid-cols-2">
                      {order.amountLabel ? <p>{t("billing.orderAmountLabel")}{order.amountLabel}</p> : null}
                      {order.paymentMethod ? <p>{t("billing.orderPaymentMethod")}{order.paymentMethod}</p> : null}
                      {order.paymentReference ? <p>{t("billing.orderPaymentReference")}{order.paymentReference}</p> : null}
                      {order.payerName ? <p>{t("billing.orderPayerName")}{order.payerName}</p> : null}
                      {order.payerPhone ? <p>{t("billing.orderPayerPhone")}{order.payerPhone}</p> : null}
                    </div>

                    {order.note ? <p className="mt-3 rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-muted">{order.note}</p> : null}

                    <textarea
                      className="mt-4 min-h-[88px] w-full rounded-[18px] border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
                      onChange={(event) =>
                        setOrderReviewNote((current) => ({
                          ...current,
                          [order.id]: event.target.value
                        }))
                      }
                      placeholder={t("billing.adminOrderReviewNote")}
                      value={orderReviewNote[order.id] ?? order.reviewedNote ?? ""}
                    />

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold text-white"
                        disabled={actionKey === `order:${order.id}:confirmed`}
                        onClick={() => handleOrderReview(order, "confirmed")}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ButtonLoadingContent
                            idleLabel={t("billing.adminApproveOrder")}
                            loading={actionKey === `order:${order.id}:confirmed`}
                            loadingLabel={t("common.processing")}
                          />
                        </span>
                      </button>
                      <button
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600"
                        disabled={actionKey === `order:${order.id}:rejected`}
                        onClick={() => handleOrderReview(order, "rejected")}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ButtonLoadingContent
                            idleLabel={t("billing.adminRejectOrder")}
                            loading={actionKey === `order:${order.id}:rejected`}
                            loadingLabel={t("common.processing")}
                            spinnerTone="dark"
                          />
                        </span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addDaysToIso(baseValue: string | null | undefined, days: number) {
  const baseDate = baseValue ? new Date(baseValue) : new Date();
  const source = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const nextDate = new Date(source.getTime());
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate.toISOString();
}

function SummaryCard({
  label,
  tone,
  value
}: {
  label: string;
  tone: "pending" | "approved" | "rejected" | "neutral";
  value: number;
}) {
  return (
    <article className="rounded-[24px] border border-white/80 bg-white/85 px-5 py-4 shadow-[0_14px_34px_rgba(19,33,29,0.035)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-2.5 w-2.5 rounded-full",
            tone === "pending"
              ? "bg-amber-500"
              : tone === "approved"
                ? "bg-emerald-500"
                : tone === "rejected"
                  ? "bg-red-500"
                  : "bg-[#17344f]/35"
          )}
        />
      </div>
      <p className="mt-3 font-display text-[2rem] leading-none text-ink">{value}</p>
    </article>
  );
}

function FilterButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition",
        active
          ? "bg-[#17344f] text-white shadow-[0_10px_20px_rgba(23,52,79,0.14)]"
          : "bg-[#f7f4ee] text-muted hover:text-ink"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function UpgradeRequestCard({
  item,
  loadingAction,
  onAction,
  onLifecycleChange,
  onPlanChange,
  onRefresh,
  onReview
}: {
  item: BillingUpgradeRequest;
  loadingAction: string | null;
  onAction: (actionKeyValue: string, runner: () => Promise<void>) => void;
  onLifecycleChange: (
    item: BillingUpgradeRequest,
    payload: {
      targetPlan: "free" | "pro";
      lifecycleStatus: "active" | "expired" | "inactive";
    }
  ) => void;
  onPlanChange: (item: BillingUpgradeRequest, targetPlan: "free" | "pro") => void;
  onRefresh: () => Promise<unknown>;
  onReview: (item: BillingUpgradeRequest, status: "approved" | "rejected") => void;
}) {
  const { t } = useI18n();
  const [expiresAtInput, setExpiresAtInput] = useState(toDateTimeLocalValue(item.expiresAt));
  const approveLoading = loadingAction === `${item.id}:approved`;
  const rejectLoading = loadingAction === `${item.id}:rejected`;
  const downgradeLoading = item.userId ? loadingAction === `${item.userId}:free` : false;
  const upgradeLoading = item.userId ? loadingAction === `${item.userId}:pro` : false;
  const activateLoading = item.userId ? loadingAction === `${item.userId}:pro:active` : false;
  const expireLoading = item.userId ? loadingAction === `${item.userId}:pro:expired` : false;
  const inactiveLoading = item.userId ? loadingAction === `${item.userId}:free:inactive` : false;
  const setExpiryLoading = item.userId ? loadingAction === `${item.userId}:expiry:set` : false;
  const clearExpiryLoading = item.userId ? loadingAction === `${item.userId}:expiry:clear` : false;
  const extend30Loading = item.userId ? loadingAction === `${item.userId}:expiry:30` : false;
  const extend90Loading = item.userId ? loadingAction === `${item.userId}:expiry:90` : false;
  const statusLabelMap = {
    pending: t("billing.statusPending"),
    approved: t("billing.statusApproved"),
    rejected: t("billing.statusRejected"),
    canceled: t("billing.statusCanceled")
  } as const;
  const currentPlanLabel = item.currentPlan === "pro" ? t("billing.proPlan") : t("billing.freePlan");
  const targetPlanLabel = item.targetPlan === "pro" ? t("billing.proPlan") : t("billing.freePlan");
  const planLabel = item.plan === "pro" ? t("billing.proPlan") : t("billing.freePlan");
  const effectivePlanLabel = item.effectivePlan === "pro" ? t("billing.proPlan") : t("billing.freePlan");
  const lifecycleLabel =
    item.lifecycleStatus === "active"
      ? t("billing.lifecycleActive")
      : item.lifecycleStatus === "expired"
        ? t("billing.lifecycleExpired")
        : t("billing.lifecycleInactive");
  const isBusy =
    approveLoading ||
    rejectLoading ||
    downgradeLoading ||
    upgradeLoading ||
    activateLoading ||
    expireLoading ||
    inactiveLoading ||
    setExpiryLoading ||
    clearExpiryLoading ||
    extend30Loading ||
    extend90Loading;
  const nextExpiresAtPreview = useMemo(() => {
    if (!expiresAtInput) {
      return null;
    }

    const date = new Date(expiresAtInput);

    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }, [expiresAtInput]);

  async function submitExpiryUpdate(mode: "set" | "clear" | "30" | "90") {
    if (!item.userId) {
      return;
    }

    let expiresAt: string | null = null;

    if (mode === "set") {
      if (!nextExpiresAtPreview) {
        throw new Error(t("billing.adminExpiryMissing"));
      }

      expiresAt = nextExpiresAtPreview;
    }

    if (mode === "30") {
      expiresAt = addDaysToIso(item.expiresAt ?? nextExpiresAtPreview, 30);
    }

    if (mode === "90") {
      expiresAt = addDaysToIso(item.expiresAt ?? nextExpiresAtPreview, 90);
    }

    if ((mode === "30" || mode === "90") && !expiresAt) {
      throw new Error(t("billing.adminExpiryInvalid"));
    }

    const actionToken =
      mode === "set"
        ? "expiry:set"
        : mode === "clear"
          ? "expiry:clear"
          : mode === "30"
            ? "expiry:30"
            : "expiry:90";

    const response = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "update_lifecycle",
        userId: item.userId,
        targetPlan: item.plan === "pro" ? "pro" : "free",
        lifecycleStatus: item.lifecycleStatus ?? "inactive",
        expiresAt: mode === "clear" ? null : expiresAt
      })
    });
    const result = (await response.json()) as {
      error?: string;
      item?: {
        expiresAt?: string | null;
      };
    };

    if (!response.ok) {
      throw new Error(result.error ?? t("billing.adminLifecycleFailed"));
    }

    setExpiresAtInput(toDateTimeLocalValue(result.item?.expiresAt ?? (mode === "clear" ? null : expiresAt)));
    await onRefresh();
  }

  return (
    <article className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-[0_18px_40px_rgba(19,33,29,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-display text-[1.45rem] leading-[1.08] text-ink">
            {item.email || t("billing.unknownUser")}
          </h2>
          {(item.companyName || item.contactName || item.contactPhone) ? (
            <div className="space-y-1 text-sm text-muted">
              {item.companyName ? <p>{t("billing.companyNameLabel")}{item.companyName}</p> : null}
              {item.contactName ? <p>{t("billing.contactNameLabel")}{item.contactName}</p> : null}
              {item.contactPhone ? <p>{t("billing.contactPhoneLabel")}{item.contactPhone}</p> : null}
            </div>
          ) : null}
          <p className="text-sm text-muted">
            {t("billing.adminPlanChange", {
              from: currentPlanLabel,
              to: targetPlanLabel
            })}
          </p>
          <p className="text-xs leading-6 text-muted">
            {t("billing.requestCreatedAt")}
            {formatDateTime(item.createdAt)}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
            item.status === "approved"
              ? "bg-emerald-50 text-emerald-700"
              : item.status === "rejected"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
          )}
        >
          {statusLabelMap[item.status]}
        </span>
      </div>

      {item.note ? (
        <div className="mt-4 rounded-2xl bg-[#fcfaf5] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/80">{t("billing.adminNoteLabel")}</p>
          <p className="mt-2 text-sm leading-7 text-muted">{item.note}</p>
        </div>
      ) : null}

      {item.updatedAt && item.status !== "pending" ? (
        <p className="mt-4 text-xs leading-6 text-muted">
          {t("billing.adminUpdatedAt")}
          {formatDateTime(item.updatedAt)}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InfoPill label={t("billing.adminCurrentSubscription")} value={planLabel} />
        <InfoPill label={t("billing.adminEffectivePlan")} value={effectivePlanLabel} />
        <InfoPill
          label={t("billing.lifecycleStatusLabel")}
          value={lifecycleLabel}
        />
      </div>

      {item.expiresAt ? (
        <p className="mt-3 text-sm leading-7 text-muted">
          {t("billing.expiresAtLabel")}
          {formatDateTime(item.expiresAt)}
        </p>
      ) : null}

      <div className="mt-4 rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/78">{t("billing.adminExpiryManager")}</p>
        <div className="mt-3 grid gap-3">
          <input
            className="min-h-11 rounded-[16px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
            onChange={(event) => setExpiresAtInput(event.target.value)}
            placeholder={t("billing.adminExpiryPlaceholder")}
            type="datetime-local"
            value={expiresAtInput}
          />
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#17344f] px-4 text-sm font-semibold text-white"
              disabled={isBusy || !item.userId}
              onClick={() => {
                if (!item.userId) {
                  return;
                }

                onAction(`${item.userId}:expiry:set`, async () => {
                  await submitExpiryUpdate("set");
                });
              }}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <ButtonLoadingContent
                  idleLabel={t("billing.adminSetExpiry")}
                  loading={setExpiryLoading}
                  loadingLabel={t("common.processing")}
                />
              </span>
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
              disabled={isBusy || !item.userId}
              onClick={() => {
                if (!item.userId) {
                  return;
                }

                onAction(`${item.userId}:expiry:clear`, async () => {
                  await submitExpiryUpdate("clear");
                });
              }}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <ButtonLoadingContent
                  idleLabel={t("billing.adminClearExpiry")}
                  loading={clearExpiryLoading}
                  loadingLabel={t("common.processing")}
                  spinnerTone="dark"
                />
              </span>
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700"
              disabled={isBusy || !item.userId}
              onClick={() => {
                if (!item.userId) {
                  return;
                }

                onAction(`${item.userId}:expiry:30`, async () => {
                  await submitExpiryUpdate("30");
                });
              }}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <ButtonLoadingContent
                  idleLabel={t("billing.adminExtend30Days")}
                  loading={extend30Loading}
                  loadingLabel={t("common.processing")}
                  spinnerTone="dark"
                />
              </span>
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700"
              disabled={isBusy || !item.userId}
              onClick={() => {
                if (!item.userId) {
                  return;
                }

                onAction(`${item.userId}:expiry:90`, async () => {
                  await submitExpiryUpdate("90");
                });
              }}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <ButtonLoadingContent
                  idleLabel={t("billing.adminExtend90Days")}
                  loading={extend90Loading}
                  loadingLabel={t("common.processing")}
                  spinnerTone="dark"
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/78">{t("billing.adminDirectPlanChange")}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
            disabled={downgradeLoading || upgradeLoading || !item.userId}
            onClick={() => onPlanChange(item, "free")}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("billing.switchToFree")}
                loading={downgradeLoading}
                loadingLabel={t("common.processing")}
                spinnerTone="dark"
              />
            </span>
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#17344f] px-4 text-sm font-semibold text-white"
            disabled={downgradeLoading || upgradeLoading || !item.userId}
            onClick={() => onPlanChange(item, "pro")}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("billing.switchToPro")}
                loading={upgradeLoading}
                loadingLabel={t("common.processing")}
              />
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/78">{t("billing.adminLifecycleActions")}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 text-sm font-semibold text-white"
            disabled={activateLoading || expireLoading || inactiveLoading || !item.userId}
            onClick={() => onLifecycleChange(item, { targetPlan: "pro", lifecycleStatus: "active" })}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("billing.activatePro")}
                loading={activateLoading}
                loadingLabel={t("common.processing")}
              />
            </span>
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700"
            disabled={activateLoading || expireLoading || inactiveLoading || !item.userId}
            onClick={() => onLifecycleChange(item, { targetPlan: "pro", lifecycleStatus: "expired" })}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("billing.markExpired")}
                loading={expireLoading}
                loadingLabel={t("common.processing")}
                spinnerTone="dark"
              />
            </span>
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
            disabled={activateLoading || expireLoading || inactiveLoading || !item.userId}
            onClick={() => onLifecycleChange(item, { targetPlan: "free", lifecycleStatus: "inactive" })}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("billing.restoreFree")}
                loading={inactiveLoading}
                loadingLabel={t("common.processing")}
                spinnerTone="dark"
              />
            </span>
          </button>
        </div>
      </div>

      {item.status === "pending" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-white"
            disabled={approveLoading || rejectLoading}
            onClick={() => onReview(item, "approved")}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("billing.approve")}
                loading={approveLoading}
                loadingLabel={t("common.processing")}
              />
            </span>
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-600"
            disabled={approveLoading || rejectLoading}
            onClick={() => onReview(item, "rejected")}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("billing.reject")}
                loading={rejectLoading}
                loadingLabel={t("common.processing")}
                spinnerTone="dark"
              />
            </span>
          </button>
        </div>
      ) : null}
    </article>
  );
}

function getPlanLabel(t: ReturnType<typeof useI18n>["t"], plan: "free" | "pro") {
  return plan === "pro" ? t("billing.proPlan") : t("billing.freePlan");
}

function getOrderStatusLabel(t: ReturnType<typeof useI18n>["t"], status: BillingOrder["status"]) {
  if (status === "pending_payment") {
    return t("billing.orderStatusPendingPayment");
  }

  if (status === "confirmed") {
    return t("billing.orderStatusConfirmed");
  }

  if (status === "rejected") {
    return t("billing.orderStatusRejected");
  }

  if (status === "canceled") {
    return t("billing.orderStatusCanceled");
  }

  return t("billing.orderStatusSubmitted");
}

function getOrderStatusTone(status: BillingOrder["status"]) {
  if (status === "confirmed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected" || status === "canceled") {
    return "bg-red-50 text-red-700";
  }

  if (status === "pending_payment") {
    return "bg-slate-100 text-slate-700";
  }

  return "bg-amber-50 text-amber-700";
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-black/6 bg-[#fcfaf5] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/72">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
