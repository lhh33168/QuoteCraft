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
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          color: "#15211d",
          background:
            "radial-gradient(circle at 10% 12%, rgba(24, 77, 63, 0.16), transparent 24%), radial-gradient(circle at 88% 8%, rgba(22, 50, 80, 0.14), transparent 24%), linear-gradient(180deg, #f6f3ed 0%, #edf1ed 100%)"
        }}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
