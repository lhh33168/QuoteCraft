import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/shared/providers/app-providers";

export const metadata: Metadata = {
  title: "QuoteCraft App",
  description: "Mobile-first quote proposal assistant MVP."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
