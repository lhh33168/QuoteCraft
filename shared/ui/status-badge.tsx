import { cn } from "@/shared/lib/cn";

type StatusBadgeProps = {
  tone: "draft" | "generated" | "shared";
  children: React.ReactNode;
};

const toneClassName: Record<StatusBadgeProps["tone"], string> = {
  draft: "bg-amber-100 text-amber-700",
  generated: "bg-emerald-100 text-emerald-700",
  shared: "bg-sky-100 text-sky-700"
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        toneClassName[tone]
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {children}
    </span>
  );
}
