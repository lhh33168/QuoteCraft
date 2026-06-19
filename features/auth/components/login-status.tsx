"use client";

import { cn } from "@/shared/lib/cn";

type LoginStatusProps = {
  kind: "idle" | "success" | "error";
  message: string | null;
};

export function LoginStatus({ kind, message }: LoginStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-6 transition",
        kind === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        kind === "error" && "border-red-200 bg-red-50 text-red-700",
        kind === "idle" && "border-black/5 bg-black/[0.03] text-muted"
      )}
    >
      {message}
    </div>
  );
}
