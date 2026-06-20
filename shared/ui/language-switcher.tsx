"use client";

import { useEffect, useRef, useState } from "react";
import { locales, type Locale } from "@/shared/i18n/config";
import { useI18n } from "@/shared/i18n/i18n-provider";

type LanguageSwitcherProps = {
  compact?: boolean;
  inverted?: boolean;
};

const localeOptionLabels: Record<Locale, string> = {
  "zh-CN": "简体中文",
  en: "English"
};

const compactOptionLabels: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "EN"
};

const languageLabels: Record<Locale, string> = {
  "zh-CN": "语言",
  en: "Language"
};

export function LanguageSwitcher({ compact = false, inverted = false }: LanguageSwitcherProps) {
  const { locale, setLocale, isSwitching } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSelect(nextLocale: Locale) {
    setOpen(false);
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  }

  if (compact) {
    return (
      <div className="relative" ref={rootRef}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className={[
            "inline-flex min-h-10 min-w-[88px] items-center justify-center gap-2 rounded-[16px] px-3 shadow-[0_8px_18px_rgba(19,33,29,0.05)] transition",
            inverted
              ? "border border-white/18 bg-[rgba(12,26,34,0.34)] text-white backdrop-blur-md hover:bg-[rgba(12,26,34,0.42)]"
              : "border border-black/8 bg-white/94 text-ink hover:bg-white"
          ].join(" ")}
          disabled={isSwitching}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="text-[13px] font-semibold">{compactOptionLabels[locale]}</span>
          <span
            aria-hidden="true"
            className={[
              "text-[11px] transition duration-200",
              open ? "rotate-180" : "",
              inverted ? "text-white/88" : "text-ink/72"
            ].join(" ")}
          >
            ▾
          </span>
        </button>

        {open ? (
          <div
            className={[
              "absolute right-0 top-[calc(100%+8px)] z-40 min-w-[104px] overflow-hidden rounded-[16px] border shadow-[0_18px_32px_rgba(19,33,29,0.18)]",
              inverted ? "border-white/14 bg-[rgba(13,29,37,0.96)] backdrop-blur-xl" : "border-black/8 bg-white"
            ].join(" ")}
            role="listbox"
          >
            {locales.map((item) => {
              const active = item === locale;

              return (
                <button
                  className={[
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] font-semibold transition",
                    inverted
                      ? active
                        ? "bg-white/12 text-white"
                        : "text-white/84 hover:bg-white/8"
                      : active
                        ? "bg-pine/8 text-ink"
                        : "text-ink hover:bg-black/[0.03]"
                  ].join(" ")}
                  key={item}
                  onClick={() => handleSelect(item)}
                  role="option"
                  type="button"
                >
                  <span>{localeOptionLabels[item]}</span>
                  {active ? (
                    <span aria-hidden="true" className={inverted ? "text-white/92" : "text-pine"}>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="relative inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/92 p-1 pl-3 shadow-[0_8px_20px_rgba(19,33,29,0.05)]"
      ref={rootRef}
    >
      <span className="text-[11px] font-semibold tracking-[0.16em] text-muted">{languageLabels[locale]}</span>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex min-h-9 items-center gap-2 rounded-full px-2 pr-3 text-sm font-semibold text-ink transition hover:bg-black/[0.03]"
        disabled={isSwitching}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{localeOptionLabels[locale]}</span>
        <span aria-hidden="true" className={["text-[11px] text-ink/72 transition duration-200", open ? "rotate-180" : ""].join(" ")}>
          ▾
        </span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[140px] overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-[0_18px_32px_rgba(19,33,29,0.12)]"
          role="listbox"
        >
          {locales.map((item) => {
            const active = item === locale;

            return (
              <button
                className={[
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition",
                  active ? "bg-pine/8 text-ink" : "text-ink hover:bg-black/[0.03]"
                ].join(" ")}
                key={item}
                onClick={() => handleSelect(item)}
                role="option"
                type="button"
              >
                <span>{localeOptionLabels[item]}</span>
                {active ? (
                  <span aria-hidden="true" className="text-pine">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
