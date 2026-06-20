import type { Locale } from "@/shared/i18n/config";
import en from "@/shared/i18n/messages/en";
import zhCN from "@/shared/i18n/messages/zh-CN";

export type Messages = typeof zhCN;

export const messages: Record<Locale, Messages> = {
  "zh-CN": zhCN,
  en
};
