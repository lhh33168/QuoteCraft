"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";
import { WorkspacePage } from "@/features/workspace/components/workspace-page";
import { fetchProjects } from "@/features/workspace/lib/fetch-projects";
import { queryKeys } from "@/shared/lib/query-keys";
import type { Project } from "@/shared/types/project";

type WorkspacePageClientProps = {
  initialProjects: Project[];
};

const projectTypeLabelMap: Record<Project["projectType"], string> = {
  website: "官网开发",
  mini_program: "小程序开发",
  admin_panel: "后台管理系统",
  custom: "定制项目"
};

export function WorkspacePageClient({ initialProjects }: WorkspacePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);
  const { data } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
    initialData: initialProjects
  });

  useEffect(() => {
    const saved = searchParams.get("saved");

    if (!saved) {
      return;
    }

    setNotice(saved === "created" ? "项目已创建并保存，已返回工作台。" : "项目已保存，已返回工作台。");

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("saved");
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;

    router.replace(nextUrl as Route);
  }, [pathname, router, searchParams]);

  const normalizedSearch = deferredSearchValue.trim().toLowerCase();
  const projects = normalizedSearch
    ? data.filter((project) => {
        const haystacks = [
          project.title,
          project.clientName,
          project.clientCompany ?? "",
          projectTypeLabelMap[project.projectType]
        ];

        return haystacks.some((value) => value.toLowerCase().includes(normalizedSearch));
      })
    : data;

  return (
    <WorkspacePage
      notice={notice}
      onSearchChange={setSearchValue}
      projects={projects}
      searchValue={searchValue}
    />
  );
}
