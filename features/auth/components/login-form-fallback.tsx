"use client";

import { useI18n } from "@/shared/i18n/i18n-provider";

export function LoginFormFallback() {
  const { t } = useI18n();

  return (
    <div className="rounded-[30px] border border-white/80 bg-white p-6 text-sm text-muted shadow-soft sm:p-8">
      {t("login.loadingForm")}
    </div>
  );
}
