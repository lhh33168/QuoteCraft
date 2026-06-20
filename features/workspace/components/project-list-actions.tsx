"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

type ProjectListActionsProps = {
  projectId: string;
};

export function ProjectListActions({ projectId }: ProjectListActionsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"default" | "error" | "success">("default");
  const [showUpgradeLink, setShowUpgradeLink] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      setMessageTone("default");
      setShowUpgradeLink(false);
      setMessage(t("projectActions.duplicating"));

      try {
        const response = await fetch(`/api/projects/${projectId}/duplicate`, {
          method: "POST"
        });
        const data = (await response.json()) as {
          project?: {
            id: string;
          };
          error?: string;
          code?: string;
        };

        if (!response.ok || !data.project?.id) {
          setMessageTone("error");
          setShowUpgradeLink(data.code === "PROJECT_LIMIT_REACHED");
          setMessage(
            data.code === "PROJECT_LIMIT_REACHED"
              ? t("projectActions.duplicateLimitReached")
              : (data.error ?? t("projectActions.duplicateFailed"))
          );
          return;
        }

        setMessageTone("success");
        setMessage(t("projectActions.duplicateSuccess"));
        await queryClient.invalidateQueries({
          queryKey: ["projects"]
        });
        router.push(`/projects/${data.project.id}`);
      } catch {
        setMessageTone("error");
        setMessage(t("projectActions.duplicateRequestFailed"));
      }
    });
  }

  function handleDelete() {
    setDeleteOpen(true);
  }

  function confirmDelete() {
    startTransition(async () => {
      setMessageTone("default");
      setShowUpgradeLink(false);
      setMessage(t("projectActions.deleting"));

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          setMessageTone("error");
          setMessage(t("projectActions.deleteFailed"));
          return;
        }

        setDeleteOpen(false);
        setMessageTone("success");
        setMessage(t("projectActions.deleteSuccess"));
        await queryClient.invalidateQueries({
          queryKey: ["projects"]
        });
      } catch {
        setMessageTone("error");
        setMessage(t("projectActions.deleteRequestFailed"));
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink"
            disabled={isPending}
            onClick={handleDuplicate}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("projectActions.duplicate")}
                loading={isPending}
                loadingLabel={t("common.processing")}
                spinnerTone="dark"
              />
            </span>
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600"
            disabled={isPending}
            onClick={handleDelete}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ButtonLoadingContent
                idleLabel={t("projectActions.delete")}
                loading={isPending}
                loadingLabel={t("common.processing")}
                spinnerTone="dark"
              />
            </span>
          </button>
        </div>
        {message ? (
          <div
            className={[
              "rounded-2xl px-3 py-2 text-xs leading-6",
              messageTone === "success"
                ? "bg-emerald-50 text-emerald-700"
                : messageTone === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-black/[0.03] text-muted"
            ].join(" ")}
          >
            <p>{message}</p>
            {showUpgradeLink ? (
              <Link className="mt-1 inline-flex font-semibold text-pine underline-offset-2 hover:underline" href="/settings/billing">
                {t("workspace.goToSubscription")}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        cancelLabel={t("projectActions.cancelDeleteAction")}
        confirmLabel={t("projectActions.confirmDeleteAction")}
        confirmTone="danger"
        description={t("projectActions.confirmDeleteDescription")}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        open={deleteOpen}
        pending={isPending}
        title={t("projectActions.confirmDeleteTitle")}
      />
    </>
  );
}
