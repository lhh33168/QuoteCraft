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
      className="group inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-[16px] bg-white px-3 text-sm font-semibold text-ink ring-1 ring-black/6 transition duration-200 hover:bg-[#fbfcfa] hover:text-pine"
      onClick={handleBack}
      type="button"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f4f7f1] text-ink transition group-hover:bg-pine/12 group-hover:text-pine">
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
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
