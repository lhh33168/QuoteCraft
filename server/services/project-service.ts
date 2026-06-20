import { projectRepository } from "@/server/repositories/project-repository";
import { requireUser } from "@/server/auth/require-user";
import { billingService } from "@/server/billing/billing-service";
import type { ProjectDetail } from "@/shared/types/project";

export const projectService = {
  async listProjects() {
    const user = await requireUser();
    return projectRepository.listByUser(user.id);
  },
  async getProjectDetail(id: string) {
    const user = await requireUser();
    return projectRepository.getById(id, user.id);
  },
  async getSharedProject(token: string) {
    return projectRepository.getByShareToken(token);
  },
  async createProject(payload: ProjectDetail) {
    const user = await requireUser();
    return projectRepository.create(user.id, payload);
  },
  async updateProject(id: string, payload: ProjectDetail) {
    const user = await requireUser();
    return projectRepository.update(id, user.id, payload);
  },
  async deleteProject(id: string) {
    const user = await requireUser();
    return projectRepository.remove(id, user.id);
  },
  async ensureProjectShareToken(id: string) {
    const user = await requireUser();
    await billingService.assertUserCanUse(user.id, "share_access");
    return projectRepository.ensureShareToken(id, user.id);
  },
  async assertCurrentUserCanExportProject(id: string) {
    const user = await requireUser();
    const detail = await projectRepository.getById(id, user.id);
    await billingService.assertUserCanUse(user.id, "export_pdf");
    return detail;
  },
  async getSharedProjectWithAccess(token: string) {
    const ownerId = await projectRepository.getOwnerIdByShareToken(token);
    const detail = await projectRepository.getByShareToken(token);
    const billingAccess = await billingService.getEntitlementsByUserId(ownerId);

    return {
      detail,
      billingAccess
    };
  }
};
