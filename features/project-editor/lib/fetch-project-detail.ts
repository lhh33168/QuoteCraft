import type { ProjectDetail } from "@/shared/types/project";

export async function fetchProjectDetail(id: string): Promise<ProjectDetail> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch project detail.");
  }

  return (await response.json()) as ProjectDetail;
}
