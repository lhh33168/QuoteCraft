"use client";

import { cn } from "@/shared/lib/cn";

type SaveStatusProps = {
  kind: "idle" | "saving" | "success" | "error";
  message: string | null;
};

export function SaveStatus({ kind, message }: SaveStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-6",
        kind === "saving" && "bg-black/5 text-muted",
        kind === "success" && "bg-emerald-50 text-emerald-700",
        kind === "error" && "bg-red-50 text-red-700",
        kind === "idle" && "bg-black/5 text-muted"
      )}
    >
      {message}
    </div>
  );
}
