import type { Project } from "@/shared/types/project";

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects", {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch projects.");
  }

  const data = (await response.json()) as {
    items: Project[];
  };

  return data.items;
}
