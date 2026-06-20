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
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/92 text-ink shadow-[0_6px_16px_rgba(19,33,29,0.05)] transition duration-200 hover:border-pine/20 hover:text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/14 active:scale-[0.98] sm:h-10 sm:w-10"
      onClick={handleBack}
      type="button"
    >
      <span className="flex h-5 w-5 items-center justify-center text-ink transition group-hover:text-pine">
        <svg
          aria-hidden="true"
          className="h-[17px] w-[17px] shrink-0"
          fill="none"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.75 3.5L5.25 8L9.75 12.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </span>
    </button>
  );
}
