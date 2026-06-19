export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const
};
