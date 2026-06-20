"use client";

import { createContext, useContext, useMemo, useTransition } from "react";
import { LOCALE_COOKIE_NAME, type Locale } from "@/shared/i18n/config";
import { getMessage } from "@/shared/i18n/get-message";
import type { Messages } from "@/shared/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  t: (path: string) => string;
  setLocale: (locale: Locale) => void;
  isSwitching: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
};

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  const [isSwitching, startTransition] = useTransition();

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (path) => getMessage(messages, path),
      setLocale: (nextLocale) => {
        startTransition(() => {
          document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
          window.location.reload();
        });
      },
      isSwitching
    }),
    [isSwitching, locale, messages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
