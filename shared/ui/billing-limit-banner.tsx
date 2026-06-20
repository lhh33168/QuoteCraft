"use client";

import Link from "next/link";
import type { Route } from "next";

type BillingLimitBannerProps = {
  actionLabel: string;
  description: string;
  href: Route;
  title: string;
};

export function BillingLimitBanner({ actionLabel, description, href, title }: BillingLimitBannerProps) {
  return (
    <div className="rounded-[22px] border border-amber-200 bg-amber-50/90 px-4 py-4 text-amber-900 shadow-[0_10px_24px_rgba(19,33,29,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-6">{title}</p>
          <p className="mt-1 text-sm leading-6 text-amber-800/90">{description}</p>
        </div>
        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-amber-700 shadow-[0_8px_18px_rgba(255,255,255,0.24)]"
          href={href}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
