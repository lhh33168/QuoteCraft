"use client";

import { useI18n } from "@/shared/i18n/i18n-provider";
import { AppShell } from "@/shared/ui/app-shell";

export function BillingPage() {
  const { t } = useI18n();

  return (
    <AppShell
      backHref="/workspace"
      backLabel={t("billing.backToWorkspace")}
      eyebrow={t("billing.eyebrow")}
      title={t("billing.title")}
      description={t("billing.description")}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-3xl text-ink">{t("billing.freePlan")}</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-muted">
            <li>{t("billing.freeFeature1")}</li>
            <li>{t("billing.freeFeature2")}</li>
            <li>{t("billing.freeFeature3")}</li>
            <li>{t("billing.freeFeature4")}</li>
          </ul>
        </section>

        <section className="rounded-[28px] bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] p-6 text-white">
          <h2 className="font-display text-3xl">{t("billing.proPlan")}</h2>
          <strong className="mt-4 block font-display text-5xl">{t("billing.proPrice")}</strong>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-white/80">
            <li>{t("billing.proFeature1")}</li>
            <li>{t("billing.proFeature2")}</li>
            <li>{t("billing.proFeature3")}</li>
            <li>{t("billing.proFeature4")}</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
