import { mockProjectDetail } from "@/features/project-editor/lib/mock-project-detail";

export function mockShareDocument(token: string) {
  const detail = mockProjectDetail(token.replace("share-", "") || "shared-project");

  return {
    token,
    ...detail
  };
}
