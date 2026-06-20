export const queryKeys = {
  billing: ["billing"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const
};
