import type { Locale } from "@/shared/i18n/config";
import en from "@/shared/i18n/messages/en";
import zhCN from "@/shared/i18n/messages/zh-CN";
import zhCNOverrides from "@/shared/i18n/messages/zh-CN-overrides";

export type Messages = typeof en;

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base } as Record<string, unknown>;

  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result as T;
}

export const messages: Record<Locale, Messages> = {
  "zh-CN": deepMerge(zhCN as unknown as Messages, zhCNOverrides as Partial<Messages>) as Messages,
  en
};
