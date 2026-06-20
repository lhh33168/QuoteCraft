import type { Messages } from "@/shared/i18n/messages";

export function getMessage(messages: Messages, path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (typeof current !== "object" || current === null || !(key in current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, messages);

  if (typeof value !== "string") {
    return path;
  }

  return value;
}
