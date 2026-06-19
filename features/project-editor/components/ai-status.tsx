"use client";

import { cn } from "@/shared/lib/cn";

type AiStatusProps = {
  kind: "idle" | "loading" | "success" | "error";
  message: string | null;
};

export function AiStatus({ kind, message }: AiStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm leading-6 transition",
        kind === "loading" && "border border-pine/10 bg-pine/5 text-ink",
        kind === "success" && "border border-emerald-200 bg-emerald-50 text-emerald-700",
        kind === "error" && "border border-red-200 bg-red-50 text-red-700",
        kind === "idle" && "border border-black/5 bg-black/[0.03] text-muted"
      )}
    >
      <span
        className={cn(
          "mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
          kind === "loading" && "animate-pulse bg-pine",
          kind === "success" && "bg-emerald-500",
          kind === "error" && "bg-red-500",
          kind === "idle" && "bg-black/20"
        )}
      />
      <span>{message}</span>
    </div>
  );
}
