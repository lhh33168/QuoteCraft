"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

type PageBackButtonProps = {
  fallbackHref?: Route;
  label?: string;
};

export function PageBackButton({
  fallbackHref = "/",
  label = "返回上一页"
}: PageBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    const canUseHistory = typeof window !== "undefined" && window.history.length > 1;
    const hasSameOriginReferrer =
      typeof document !== "undefined" &&
      document.referrer.length > 0 &&
      document.referrer.startsWith(window.location.origin);

    if (canUseHistory || hasSameOriginReferrer) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      aria-label={label}
      className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/88 px-4 text-sm font-semibold text-ink shadow-[0_10px_30px_rgba(19,33,29,0.08)] backdrop-blur transition hover:border-pine/30 hover:text-pine"
      onClick={handleBack}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.75 3.5L5.25 8L9.75 12.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
