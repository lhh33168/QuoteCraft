import { defaultLocale, LOCALE_COOKIE_NAME, normalizeLocale, type Locale } from "@/shared/i18n/config";
import { formatMessage } from "@/shared/i18n/format-message";
import { getMessage } from "@/shared/i18n/get-message";
import { messages } from "@/shared/i18n/messages";

function readCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const prefix = `${name}=`;
  const target = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!target) {
    return null;
  }

  return decodeURIComponent(target.slice(prefix.length));
}

export function getRequestLocale(request: Request): Locale {
  const cookieLocale = readCookieValue(request.headers.get("cookie"), LOCALE_COOKIE_NAME);

  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() ?? "";

  if (acceptLanguage.includes("zh")) {
    return "zh-CN";
  }

  if (acceptLanguage.includes("en")) {
    return "en";
  }

  return defaultLocale;
}

export function createRequestTranslator(request: Request) {
  const locale = getRequestLocale(request);

  return {
    locale,
    t: (path: string, values?: Record<string, string | number>) =>
      formatMessage(getMessage(messages[locale], path), values)
  };
}
