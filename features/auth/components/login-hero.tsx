"use client";

import { useI18n } from "@/shared/i18n/i18n-provider";
import { LanguageSwitcher } from "@/shared/ui/language-switcher";

export function LoginHero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(135deg,#17344f_0%,#184d3f_48%,#2c7864_100%)] p-6 text-white shadow-soft sm:p-8">
      <div className="absolute right-[-40px] top-[-60px] h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-[-80px] left-[-20px] h-56 w-56 rounded-full bg-[#f7c66a]/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            {t("login.heroEyebrow")}
          </div>
          <div className="shrink-0">
            <LanguageSwitcher compact inverted />
          </div>
        </div>
        <h1 className="mt-5 max-w-xl font-display text-4xl leading-none sm:text-6xl">{t("login.heroTitle")}</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
          {t("login.heroDescription")}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Step 01</p>
            <p className="mt-3 text-sm font-semibold">{t("login.heroStep1Title")}</p>
            <p className="mt-2 text-xs leading-6 text-white/70">{t("login.heroStep1Description")}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Step 02</p>
            <p className="mt-3 text-sm font-semibold">{t("login.heroStep2Title")}</p>
            <p className="mt-2 text-xs leading-6 text-white/70">{t("login.heroStep2Description")}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Step 03</p>
            <p className="mt-3 text-sm font-semibold">{t("login.heroStep3Title")}</p>
            <p className="mt-2 text-xs leading-6 text-white/70">{t("login.heroStep3Description")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
