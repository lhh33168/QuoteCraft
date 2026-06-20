"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { fetchBillingSnapshot } from "@/features/billing/lib/fetch-billing-snapshot";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format-datetime";
import type { BillingOrder, BillingSnapshot, SubscriptionPlan } from "@/shared/types/billing";
import { AppShell } from "@/shared/ui/app-shell";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";

type UpgradeFormState = {
  companyName: string;
  contactName: string;
  contactPhone: string;
  note: string;
};

type BillingOrderFormState = {
  amountLabel: string;
  paymentMethod: string;
  paymentReference: string;
  payerName: string;
  payerPhone: string;
  note: string;
};

function createEmptyUpgradeForm(): UpgradeFormState {
  return {
    companyName: "",
    contactName: "",
    contactPhone: "",
    note: ""
  };
}

function createEmptyOrderForm(): BillingOrderFormState {
  return {
    amountLabel: "",
    paymentMethod: "",
    paymentReference: "",
    payerName: "",
    payerPhone: "",
    note: ""
  };
}

export function BillingPage() {
  const { t } = useI18n();
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [upgradeMessageTone, setUpgradeMessageTone] = useState<"success" | "error">("success");
  const [upgradeForm, setUpgradeForm] = useState<UpgradeFormState>(createEmptyUpgradeForm);
  const [orderForm, setOrderForm] = useState<BillingOrderFormState>(createEmptyOrderForm);
  const [isPending, startTransition] = useTransition();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["billing"],
    queryFn: fetchBillingSnapshot
  });

  function handleUpgrade(targetPlan: SubscriptionPlan) {
    startTransition(async () => {
      setUpgradeMessage(null);
      setUpgradeMessageTone("success");

      try {
        const response = await fetch("/api/billing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            targetPlan,
            companyName: upgradeForm.companyName,
            contactName: upgradeForm.contactName,
            contactPhone: upgradeForm.contactPhone,
            note: upgradeForm.note
          })
        });
        const result = (await response.json()) as {
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          setUpgradeMessageTone("error");
          setUpgradeMessage(result.error ?? t("billing.upgradeFailed"));
          return;
        }

        setUpgradeMessage(result.message ?? t("billing.upgradeSubmitted"));
        setUpgradeForm(createEmptyUpgradeForm());
        await refetch();
      } catch {
        setUpgradeMessageTone("error");
        setUpgradeMessage(t("billing.upgradeFailed"));
      }
    });
  }

  function handleCancelUpgrade() {
    startTransition(async () => {
      setUpgradeMessage(null);
      setUpgradeMessageTone("success");

      try {
        const response = await fetch("/api/billing", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "cancel"
          })
        });
        const result = (await response.json()) as {
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          setUpgradeMessageTone("error");
          setUpgradeMessage(result.error ?? t("billing.cancelUpgradeFailed"));
          return;
        }

        setUpgradeMessage(result.message ?? t("billing.upgradeRequestCanceled"));
        await refetch();
      } catch {
        setUpgradeMessageTone("error");
        setUpgradeMessage(t("billing.cancelUpgradeFailed"));
      }
    });
  }

  function handleSubmitOrder(targetPlan: SubscriptionPlan) {
    startTransition(async () => {
      setUpgradeMessage(null);
      setUpgradeMessageTone("success");

      try {
        const response = await fetch("/api/billing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            targetPlan,
            submitOrder: true,
            amountLabel: orderForm.amountLabel,
            paymentMethod: orderForm.paymentMethod,
            paymentReference: orderForm.paymentReference,
            payerName: orderForm.payerName,
            payerPhone: orderForm.payerPhone,
            note: orderForm.note
          })
        });
        const result = (await response.json()) as {
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          setUpgradeMessageTone("error");
          setUpgradeMessage(result.error ?? t("billing.orderSubmitFailed"));
          return;
        }

        setUpgradeMessage(result.message ?? t("billing.orderSubmitted"));
        setOrderForm(createEmptyOrderForm());
        await refetch();
      } catch {
        setUpgradeMessageTone("error");
        setUpgradeMessage(t("billing.orderSubmitFailed"));
      }
    });
  }

  return (
    <AppShell
      backHref="/workspace"
      backLabel={t("billing.backToWorkspace")}
      eyebrow={t("billing.eyebrow")}
      title={t("billing.title")}
      description={t("billing.description")}
      heroVariant="compact"
    >
      {isLoading ? (
        <section className="rounded-[28px] border border-white/80 bg-white/85 p-6 text-sm text-muted">
          {t("billing.loading")}
        </section>
      ) : error || !data ? (
        <section className="rounded-[28px] border border-red-100 bg-red-50/90 p-6 text-sm leading-7 text-red-700">
          {error instanceof Error ? error.message : t("billing.loadFailed")}
        </section>
      ) : (
        <BillingContent
          data={data}
          isSubmitting={isPending}
          message={upgradeMessage}
          messageTone={upgradeMessageTone}
          onCancelUpgrade={handleCancelUpgrade}
          onOrderFormChange={setOrderForm}
          onSubmitOrder={handleSubmitOrder}
          onUpgrade={handleUpgrade}
          onUpgradeFormChange={setUpgradeForm}
          orderForm={orderForm}
          upgradeForm={upgradeForm}
        />
      )}
    </AppShell>
  );
}

function BillingContent({
  data,
  isSubmitting,
  message,
  messageTone,
  onCancelUpgrade,
  onOrderFormChange,
  onSubmitOrder,
  onUpgrade,
  onUpgradeFormChange,
  orderForm,
  upgradeForm
}: {
  data: BillingSnapshot;
  isSubmitting: boolean;
  message: string | null;
  messageTone: "success" | "error";
  onCancelUpgrade: () => void;
  onOrderFormChange: React.Dispatch<React.SetStateAction<BillingOrderFormState>>;
  onSubmitOrder: (targetPlan: SubscriptionPlan) => void;
  onUpgrade: (targetPlan: SubscriptionPlan) => void;
  onUpgradeFormChange: React.Dispatch<React.SetStateAction<UpgradeFormState>>;
  orderForm: BillingOrderFormState;
  upgradeForm: UpgradeFormState;
}) {
  const { t } = useI18n();
  const effectivePlan = data.effectivePlan ?? data.plan;
  const subscriptionPlan = data.subscriptionPlan ?? data.plan;
  const isFree = effectivePlan === "free";
  const upgradeStatus = data.upgradeRequest?.status ?? null;
  const showPendingRequest = upgradeStatus === "pending";
  const showResolvedRequest =
    upgradeStatus === "approved" || upgradeStatus === "rejected" || upgradeStatus === "canceled";
  const canShowUpgradeForm = effectivePlan !== "pro" && !showPendingRequest;
  const orders = data.orders ?? (data.latestOrder ? [data.latestOrder] : []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <article className="rounded-[28px] bg-[linear-gradient(135deg,#17344f_0%,#184d3f_55%,#2c7864_100%)] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{t("billing.currentPlan")}</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[2rem] leading-[1.02] sm:text-[2.4rem]">
                {isFree ? t("billing.freePlan") : t("billing.proPlan")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-white/78">
                {isFree ? t("billing.freeDescription") : t("billing.proDescription")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <InlineStatusBadge tone="light">{getLifecycleLabel(t, data.lifecycleStatus)}</InlineStatusBadge>
                {subscriptionPlan !== effectivePlan ? (
                  <InlineStatusBadge tone="outline">
                    {t("billing.subscriptionPlanLabel")}
                    {subscriptionPlan === "pro" ? t("billing.proPlan") : t("billing.freePlan")}
                  </InlineStatusBadge>
                ) : null}
              </div>
            </div>
            <div className="rounded-[22px] bg-white/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-white/70">{t("billing.accountEmail")}</p>
              <p className="mt-1 text-sm font-semibold text-white">{data.email}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.lifecycleTitle")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <UsageCard
              hint={t("billing.lifecycleHint")}
              label={t("billing.lifecycleStatusLabel")}
              value={getLifecycleValueLabel(t, data.lifecycleStatus)}
            />
            <UsageCard
              hint={data.expiresAt ? formatDateTime(data.expiresAt) : t("billing.noExpiry")}
              label={t("billing.expiresAtLabel")}
              value={data.expiresAt ? t("billing.hasExpiry") : t("billing.noExpiryShort")}
            />
          </div>
          {data.lifecycleStatus === "expired" ? (
            <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-700">
              {t("billing.lifecycleExpiredHint")}
            </p>
          ) : null}
          {subscriptionPlan === "pro" && data.lifecycleStatus === "inactive" ? (
            <p className="mt-5 rounded-2xl bg-[#fcfaf5] px-4 py-3 text-sm leading-7 text-muted">
              {t("billing.lifecycleInactiveHint")}
            </p>
          ) : null}
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.usageTitle")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <UsageCard
              hint={
                data.usage.projectLimit === null
                  ? t("billing.unlimited")
                  : `${t("billing.remaining")} ${data.usage.projectRemaining ?? 0}`
              }
              label={t("billing.projectQuota")}
              value={`${data.usage.projectCount}`}
            />
            <UsageCard
              hint={
                data.usage.aiMonthlyLimit === null
                  ? t("billing.unlimited")
                  : `${t("billing.remaining")} ${data.usage.aiRemaining ?? 0}`
              }
              label={t("billing.aiQuota")}
              value={`${data.usage.aiGeneratedThisMonth}`}
            />
          </div>

          <div className="mt-5 grid gap-3 text-sm text-muted">
            <EntitlementRow
              enabled
              label={
                data.entitlements.projectLimit === null
                  ? t("billing.projectUnlimited")
                  : t("billing.projectLimitValue", { count: data.entitlements.projectLimit })
              }
            />
            <EntitlementRow
              enabled
              label={
                data.entitlements.aiMonthlyLimit === null
                  ? t("billing.aiUnlimited")
                  : t("billing.aiLimitValue", { count: data.entitlements.aiMonthlyLimit })
              }
            />
            <EntitlementRow enabled={data.entitlements.shareEnabled} label={t("billing.shareEnabled")} />
            <EntitlementRow enabled={data.entitlements.exportPdfEnabled} label={t("billing.exportPdfEnabled")} />
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.lifecycleGuideTitle")}</h2>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-muted">
            <GuideRow label={t("billing.lifecycleGuideExpired")} />
            <GuideRow label={t("billing.lifecycleGuideRecover")} />
            <GuideRow label={t("billing.lifecycleGuideAdmin")} />
          </div>
        </article>

        {data.isAdmin ? (
          <article className="rounded-[28px] border border-[#17344f]/10 bg-[#17344f]/[0.03] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-[1.25rem] leading-[1.08] text-ink">{t("billing.adminTitle")}</h2>
                <p className="mt-1.5 text-sm leading-7 text-muted">{t("billing.adminEntryDescription")}</p>
              </div>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#17344f] px-4 text-sm font-semibold text-white"
                href="/settings/billing/admin"
              >
                {t("billing.adminEntry")}
              </Link>
            </div>
          </article>
        ) : null}
      </section>

      <section className="space-y-6">
        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.planCompareTitle")}</h2>
          <div className="mt-5 grid gap-4">
            <PlanCard
              active={effectivePlan === "free"}
              description={t("billing.freeDescription")}
              features={[
                t("billing.freeFeature1"),
                t("billing.freeFeature2"),
                t("billing.freeFeature3"),
                t("billing.freeFeature4")
              ]}
              title={t("billing.freePlan")}
            />
            <PlanCard
              active={effectivePlan === "pro"}
              cta={
                effectivePlan === "pro" ? (
                  <span className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/12 px-5 text-sm font-semibold text-white/88">
                    {t("billing.currentPlanActive")}
                  </span>
                ) : (
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#17344f]"
                    disabled={isSubmitting || showPendingRequest}
                    onClick={() => onUpgrade("pro")}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ButtonLoadingContent
                        idleLabel={showResolvedRequest ? t("billing.resubmitUpgradeRequest") : t("billing.upgradeToPro")}
                        loading={isSubmitting}
                        loadingLabel={t("common.processing")}
                        spinnerTone="dark"
                      />
                    </span>
                  </button>
                )
              }
              description={t("billing.proDescription")}
              emphasis
              features={[
                t("billing.proFeature1"),
                t("billing.proFeature2"),
                t("billing.proFeature3"),
                t("billing.proFeature4")
              ]}
              price={t("billing.proPrice")}
              title={t("billing.proPlan")}
            />
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.upgradeStatusTitle")}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
            {showPendingRequest && data.upgradeRequest ? (
              <>
                <p>{t("billing.upgradeRequestPending")}</p>
                <UpgradeRequestDetails request={data.upgradeRequest} />
                <div className="pt-2">
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
                    disabled={isSubmitting}
                    onClick={onCancelUpgrade}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ButtonLoadingContent
                        idleLabel={t("billing.cancelUpgradeRequest")}
                        loading={isSubmitting}
                        loadingLabel={t("common.processing")}
                        spinnerTone="dark"
                      />
                    </span>
                  </button>
                </div>
              </>
            ) : null}

            {showResolvedRequest && data.upgradeRequest ? (
              <>
                <p>
                  {data.upgradeRequest.status === "approved"
                    ? t("billing.upgradeApproved")
                    : data.upgradeRequest.status === "rejected"
                      ? t("billing.upgradeRejected")
                      : t("billing.upgradeCanceled")}
                </p>
                <UpgradeRequestDetails request={data.upgradeRequest} />
                {data.upgradeRequest.status !== "approved" ? (
                  <p className="rounded-2xl bg-[#fcfaf5] px-4 py-3 text-muted">{t("billing.upgradeResubmitHint")}</p>
                ) : null}
              </>
            ) : null}

            {!data.upgradeRequest ? <p>{t("billing.noUpgradeRequest")}</p> : null}

            {canShowUpgradeForm ? (
              <>
                {showResolvedRequest ? <p className="pt-1 text-sm text-muted">{t("billing.upgradeResubmitTitle")}</p> : null}
                <UpgradeRequestForm onChange={onUpgradeFormChange} value={upgradeForm} />
              </>
            ) : null}

            {data.recommendedPlan ? (
              <p className="rounded-2xl bg-pine/6 px-4 py-3 text-pine">{t("billing.recommendedPlanHint")}</p>
            ) : null}

            {message ? (
              <p
                className={cn(
                  "rounded-2xl px-4 py-3",
                  messageTone === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                )}
              >
                {message}
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <div className="space-y-2">
            <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.latestOrderTitle")}</h2>
            <p className="text-sm leading-7 text-muted">{t("billing.latestOrderDescription")}</p>
          </div>
          <div className="mt-4">
            {data.latestOrder ? (
              <BillingOrderCard order={data.latestOrder} />
            ) : (
              <p className="rounded-2xl bg-[#fcfaf5] px-4 py-3 text-sm text-muted">{t("billing.orderHistoryEmpty")}</p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <div className="space-y-2">
            <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.orderFormTitle")}</h2>
            <p className="text-sm leading-7 text-muted">{t("billing.orderFormDescription")}</p>
          </div>
          <div className="mt-4">
            <OfflineOrderForm
              disabled={isSubmitting}
              onChange={onOrderFormChange}
              onSubmit={() => onSubmitOrder("pro")}
              value={orderForm}
            />
          </div>
        </article>

        <article className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[1.55rem] leading-[1.08] text-ink">{t("billing.orderHistoryTitle")}</h2>
            <span className="rounded-full bg-[#f7f4ee] px-3 py-1 text-xs font-semibold text-muted">{orders.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {orders.length ? (
              orders.map((order) => <BillingOrderCard key={order.id} order={order} />)
            ) : (
              <p className="rounded-2xl bg-[#fcfaf5] px-4 py-3 text-sm text-muted">{t("billing.orderHistoryEmpty")}</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function UpgradeRequestDetails({ request }: { request: BillingSnapshot["upgradeRequest"] }) {
  const { t } = useI18n();

  if (!request) {
    return null;
  }

  return (
    <>
      <p>
        {t("billing.requestCreatedAt")}
        {formatDateTime(request.createdAt)}
      </p>
      {request.updatedAt ? (
        <p>
          {t("billing.requestUpdatedAt")}
          {formatDateTime(request.updatedAt)}
        </p>
      ) : null}
      {request.companyName ? (
        <p>
          {t("billing.companyNameLabel")}
          {request.companyName}
        </p>
      ) : null}
      {request.contactName ? (
        <p>
          {t("billing.contactNameLabel")}
          {request.contactName}
        </p>
      ) : null}
      {request.contactPhone ? (
        <p>
          {t("billing.contactPhoneLabel")}
          {request.contactPhone}
        </p>
      ) : null}
      {request.note ? <p className="rounded-2xl bg-[#fcfaf5] px-4 py-3 text-muted">{request.note}</p> : null}
    </>
  );
}

function UpgradeRequestForm({
  onChange,
  value
}: {
  onChange: React.Dispatch<React.SetStateAction<UpgradeFormState>>;
  value: UpgradeFormState;
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3 pt-1">
      <FieldLabel label={t("billing.companyName")} />
      <input
        className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            companyName: event.target.value
          }))
        }
        placeholder={t("billing.companyNamePlaceholder")}
        value={value.companyName}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-3">
          <FieldLabel label={t("billing.contactName")} />
          <input
            className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                contactName: event.target.value
              }))
            }
            placeholder={t("billing.contactNamePlaceholder")}
            value={value.contactName}
          />
        </div>
        <div className="grid gap-3">
          <FieldLabel label={t("billing.contactPhone")} />
          <input
            className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                contactPhone: event.target.value
              }))
            }
            placeholder={t("billing.contactPhonePlaceholder")}
            value={value.contactPhone}
          />
        </div>
      </div>
      <FieldLabel label={t("billing.upgradeNote")} />
      <textarea
        className="min-h-[110px] rounded-[18px] border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-muted/70 focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            note: event.target.value
          }))
        }
        placeholder={t("billing.upgradeNotePlaceholder")}
        value={value.note}
      />
    </div>
  );
}

function OfflineOrderForm({
  disabled,
  onChange,
  onSubmit,
  value
}: {
  disabled: boolean;
  onChange: React.Dispatch<React.SetStateAction<BillingOrderFormState>>;
  onSubmit: () => void;
  value: BillingOrderFormState;
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3 rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4">
      <FieldLabel label={t("billing.orderAmountLabel")} />
      <input
        className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            amountLabel: event.target.value
          }))
        }
        placeholder={t("billing.orderAmountPlaceholder")}
        value={value.amountLabel}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-3">
          <FieldLabel label={t("billing.orderPaymentMethod")} />
          <input
            className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                paymentMethod: event.target.value
              }))
            }
            placeholder={t("billing.orderPaymentMethodPlaceholder")}
            value={value.paymentMethod}
          />
        </div>
        <div className="grid gap-3">
          <FieldLabel label={t("billing.orderPaymentReference")} />
          <input
            className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                paymentReference: event.target.value
              }))
            }
            placeholder={t("billing.orderPaymentReferencePlaceholder")}
            value={value.paymentReference}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-3">
          <FieldLabel label={t("billing.orderPayerName")} />
          <input
            className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                payerName: event.target.value
              }))
            }
            placeholder={t("billing.orderPayerNamePlaceholder")}
            value={value.payerName}
          />
        </div>
        <div className="grid gap-3">
          <FieldLabel label={t("billing.orderPayerPhone")} />
          <input
            className="min-h-11 rounded-[18px] border border-black/8 bg-white px-4 text-sm text-ink outline-none transition focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                payerPhone: event.target.value
              }))
            }
            placeholder={t("billing.orderPayerPhonePlaceholder")}
            value={value.payerPhone}
          />
        </div>
      </div>
      <FieldLabel label={t("billing.orderNoteLabel")} />
      <textarea
        className="min-h-[96px] rounded-[18px] border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-muted/70 focus:border-pine/30 focus:ring-2 focus:ring-pine/8"
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            note: event.target.value
          }))
        }
        placeholder={t("billing.orderNotePlaceholder")}
        value={value.note}
      />
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#17344f] px-5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={disabled}
        onClick={onSubmit}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <ButtonLoadingContent
            idleLabel={t("billing.submitOrder")}
            loading={disabled}
            loadingLabel={t("common.processing")}
          />
        </span>
      </button>
    </div>
  );
}

function BillingOrderCard({ order }: { order: BillingOrder }) {
  const { t } = useI18n();
  const currentPlanLabel = order.currentPlan === "pro" ? t("billing.proPlan") : t("billing.freePlan");
  const targetPlanLabel = order.targetPlan === "pro" ? t("billing.proPlan") : t("billing.freePlan");

  return (
    <article className="rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">
            {currentPlanLabel} -&gt; {targetPlanLabel}
          </p>
          <p className="text-xs leading-6 text-muted">
            {t("billing.orderSubmittedAt")}
            {formatDateTime(order.createdAt)}
          </p>
          {order.updatedAt ? (
            <p className="text-xs leading-6 text-muted">
              {t("billing.orderUpdatedAt")}
              {formatDateTime(order.updatedAt)}
            </p>
          ) : null}
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getOrderStatusTone(order.status))}>
          {getOrderStatusLabel(t, order.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm leading-7 text-muted sm:grid-cols-2">
        {order.amountLabel ? (
          <p>
            {t("billing.orderAmountLabel")}
            {order.amountLabel}
          </p>
        ) : null}
        {order.paymentMethod ? (
          <p>
            {t("billing.orderPaymentMethod")}
            {order.paymentMethod}
          </p>
        ) : null}
        {order.paymentReference ? (
          <p>
            {t("billing.orderPaymentReference")}
            {order.paymentReference}
          </p>
        ) : null}
        {order.payerName ? (
          <p>
            {t("billing.orderPayerName")}
            {order.payerName}
          </p>
        ) : null}
        {order.payerPhone ? (
          <p>
            {t("billing.orderPayerPhone")}
            {order.payerPhone}
          </p>
        ) : null}
      </div>

      {order.note ? <p className="mt-3 rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-muted">{order.note}</p> : null}
      {order.reviewedNote ? (
        <div className="mt-3 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700/80">{t("billing.orderReviewedNote")}</p>
          <p className="mt-2 text-sm leading-7 text-emerald-800">{order.reviewedNote}</p>
        </div>
      ) : null}
    </article>
  );
}

function UsageCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-[#fcfaf5] px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 font-display text-[2rem] leading-none text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/78">{label}</label>;
}

function EntitlementRow({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn("inline-flex h-2.5 w-2.5 rounded-full", enabled ? "bg-pine" : "bg-black/15")}
      />
      <span>{label}</span>
    </div>
  );
}

function GuideRow({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-[#fcfaf5] px-4 py-3">
      <span aria-hidden="true" className="mt-2 inline-flex h-2.5 w-2.5 rounded-full bg-pine" />
      <span>{label}</span>
    </div>
  );
}

function PlanCard({
  active,
  cta,
  description,
  emphasis = false,
  features,
  price,
  title
}: {
  active: boolean;
  cta?: React.ReactNode;
  description: string;
  emphasis?: boolean;
  features: string[];
  price?: string;
  title: string;
}) {
  const { t } = useI18n();

  return (
    <section
      className={cn(
        "rounded-[28px] p-5",
        emphasis
          ? "bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] text-white"
          : "border border-black/6 bg-[#fcfaf5] text-ink"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[1.45rem] leading-[1.05]">{title}</h3>
          {price ? <p className="mt-3 font-display text-[2rem] leading-none">{price}</p> : null}
          <p className={cn("mt-3 text-sm leading-7", emphasis ? "text-white/80" : "text-muted")}>{description}</p>
        </div>
        {active ? (
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
              emphasis ? "bg-white/12 text-white" : "bg-pine/8 text-pine"
            )}
          >
            {t("billing.currentPlanActive")}
          </span>
        ) : null}
      </div>

      <ul className={cn("mt-5 space-y-3 text-sm leading-7", emphasis ? "text-white/82" : "text-muted")}>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      {cta ? <div className="mt-5">{cta}</div> : null}
    </section>
  );
}

function InlineStatusBadge({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: "light" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "light" ? "bg-white/14 text-white" : "border border-white/16 bg-black/10 text-white/88"
      )}
    >
      {children}
    </span>
  );
}

function getLifecycleLabel(
  t: ReturnType<typeof useI18n>["t"],
  status: BillingSnapshot["lifecycleStatus"]
) {
  if (status === "active") {
    return t("billing.lifecycleActive");
  }

  if (status === "expired") {
    return t("billing.lifecycleExpired");
  }

  return t("billing.lifecycleInactive");
}

function getLifecycleValueLabel(
  t: ReturnType<typeof useI18n>["t"],
  status: BillingSnapshot["lifecycleStatus"]
) {
  if (status === "active") {
    return t("billing.lifecycleActiveShort");
  }

  if (status === "expired") {
    return t("billing.lifecycleExpiredShort");
  }

  return t("billing.lifecycleInactiveShort");
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
