"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type MobileActionBarProps = {
  note?: string;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function MobileActionBar({
  note,
  primaryAction,
  secondaryAction,
  className
}: MobileActionBarProps) {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-30 lg:hidden print:hidden", className)}>
      <div className="app-safe-bottom-comfortable app-bottom-bar app-bottom-bar-compact w-full border-x-0 px-3 pb-0 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl pb-1">
          {note ? <p className="mb-3 text-[11px] leading-5 text-muted/85">{note}</p> : null}
          <div className={cn("mobile-bottom-bar-actions", !secondaryAction && "grid-cols-1")}>
            {secondaryAction ? <div className="mobile-bottom-bar-action">{secondaryAction}</div> : null}
            <div className="mobile-bottom-bar-action">{primaryAction}</div>
          </div>
        </div>
        </div>
    </div>
  );
}
