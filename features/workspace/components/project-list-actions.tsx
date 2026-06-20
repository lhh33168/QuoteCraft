"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ButtonLoadingContent } from "@/shared/ui/button-loading-content";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

type ProjectListActionsProps = {
  projectId: string;
};

export function ProjectListActions({ projectId }: ProjectListActionsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      setMessage("正在复制项目...");

      try {
        const response = await fetch(`/api/projects/${projectId}/duplicate`, {
          method: "POST"
        });
        const data = (await response.json()) as {
          project?: {
            id: string;
          };
        };

        if (!response.ok || !data.project?.id) {
          setMessage("复制失败，请稍后重试。");
          return;
        }

        setMessage("复制成功，正在跳转...");
        await queryClient.invalidateQueries({
          queryKey: ["projects"]
        });
        router.push(`/projects/${data.project.id}`);
      } catch {
        setMessage("复制请求失败。");
      }
    });
  }

  function handleDelete() {
    setDeleteOpen(true);
  }

  function confirmDelete() {
    startTransition(async () => {
      setMessage("正在删除项目...");

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          setMessage("删除失败，请稍后重试。");
          return;
        }

        setDeleteOpen(false);
        setMessage("项目已删除。");
        await queryClient.invalidateQueries({
          queryKey: ["projects"]
        });
      } catch {
        setMessage("删除请求失败。");
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
                idleLabel="复制"
                loading={isPending}
                loadingLabel="处理中..."
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
                idleLabel="删除"
                loading={isPending}
                loadingLabel="处理中..."
                spinnerTone="dark"
              />
            </span>
          </button>
        </div>
        {message ? <p className="text-xs leading-6 text-muted">{message}</p> : null}
      </div>

      <ConfirmDialog
        cancelLabel="先不删"
        confirmLabel="确认删除"
        confirmTone="danger"
        description="删除后该项目将从工作台移除，当前页面无法直接恢复。"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        open={deleteOpen}
        pending={isPending}
        title="确认删除这个项目？"
      />
    </>
  );
}
