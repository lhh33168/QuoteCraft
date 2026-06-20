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
      className="group inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-[18px] border border-[#d9e3dc] bg-white/96 px-3 text-sm font-semibold text-ink shadow-[0_10px_24px_rgba(19,33,29,0.06)] transition duration-200 hover:-translate-y-[1px] hover:border-pine/18 hover:bg-[#fcfdfb] hover:text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/14 active:translate-y-0 sm:h-10 sm:min-w-10"
      onClick={handleBack}
      type="button"
    >
      <span className="flex h-5 w-5 items-center justify-center text-ink transition group-hover:text-pine">
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
            strokeWidth="1.7"
          />
        </svg>
      </span>
      <span className="hidden text-[13px] sm:inline">{label}</span>
    </button>
  );
}
