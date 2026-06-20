"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { Locale } from "@/shared/i18n/config";
import { I18nProvider } from "@/shared/i18n/i18n-provider";
import type { Messages } from "@/shared/i18n/messages";

type AppProvidersProps = {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
};

export function AppProviders({ children, locale, messages }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
