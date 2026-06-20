"use client";

type ButtonLoadingContentProps = {
  loading: boolean;
  idleLabel: string;
  loadingLabel: string;
  spinnerTone?: "light" | "dark";
};

export function ButtonLoadingContent({
  loading,
  idleLabel,
  loadingLabel,
  spinnerTone = "light"
}: ButtonLoadingContentProps) {
  return (
    <>
      {loading ? (
        <span
          aria-hidden="true"
          className={[
            "inline-flex h-4 w-4 animate-spin rounded-full border-2",
            spinnerTone === "light" ? "border-white/30 border-t-white" : "border-ink/20 border-t-pine"
          ].join(" ")}
        />
      ) : null}
      <span>{loading ? loadingLabel : idleLabel}</span>
    </>
  );
}
