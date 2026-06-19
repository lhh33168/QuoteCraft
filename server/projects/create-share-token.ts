import { randomUUID } from "node:crypto";

export function createShareToken(projectId: string) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  return `share-${projectId}-${suffix}`;
}
