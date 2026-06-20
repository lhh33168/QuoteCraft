"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";
import { fetchBillingSnapshot } from "@/features/billing/lib/fetch-billing-snapshot";
import { WorkspacePage } from "@/features/workspace/components/workspace-page";
import { fetchProjects } from "@/features/workspace/lib/fetch-projects";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { queryKeys } from "@/shared/lib/query-keys";
import type { BillingSnapshot } from "@/shared/types/billing";
import type { Project } from "@/shared/types/project";

type WorkspacePageClientProps = {
  initialProjects: Project[];
  initialBillingSnapshot?: BillingSnapshot | null;
  initialBillingError?: string | null;
};

export function WorkspacePageClient({
  initialProjects,
  initialBillingSnapshot,
  initialBillingError
}: WorkspacePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [notice, setNotice] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);
  const { data } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
    initialData: initialProjects
  });
  const { data: billingSnapshot, error: billingError } = useQuery({
    queryKey: queryKeys.billing,
    queryFn: fetchBillingSnapshot,
    initialData: initialBillingSnapshot ?? undefined,
    staleTime: 30_000,
    retry: false
  });

  useEffect(() => {
    const saved = searchParams.get("saved");

    if (!saved) {
      return;
    }

    setNotice(saved === "created" ? t("workspace.noticeCreated") : t("workspace.noticeSaved"));

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("saved");
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;

    router.replace(nextUrl as Route);
  }, [pathname, router, searchParams, t]);

  const normalizedSearch = deferredSearchValue.trim().toLowerCase();
  const projects = normalizedSearch
    ? data.filter((project) => {
        const haystacks = [
          project.title,
          project.clientName,
          project.clientCompany ?? "",
          project.projectType
        ];

        return haystacks.some((value) => value.toLowerCase().includes(normalizedSearch));
      })
    : data;

  return (
    <WorkspacePage
      billingError={billingError instanceof Error ? billingError.message : initialBillingError ?? null}
      billingSnapshot={billingSnapshot ?? null}
      notice={notice}
      onSearchChange={setSearchValue}
      projects={projects}
      searchValue={searchValue}
    />
  );
}
