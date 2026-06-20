import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { defaultLocale, LOCALE_COOKIE_NAME, normalizeLocale } from "@/shared/i18n/config";
import { messages } from "@/shared/i18n/messages";
import { AppProviders } from "@/shared/providers/app-providers";

export const metadata: Metadata = {
  title: "QuoteCraft App",
  description: "Mobile-first quote proposal assistant MVP."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? defaultLocale);

  return (
    <html lang={locale}>
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          color: "#15211d",
          background:
            "radial-gradient(circle at 10% 12%, rgba(24, 77, 63, 0.16), transparent 24%), radial-gradient(circle at 88% 8%, rgba(22, 50, 80, 0.14), transparent 24%), linear-gradient(180deg, #f6f3ed 0%, #edf1ed 100%)"
        }}
      >
        <AppProviders locale={locale} messages={messages[locale]}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
