import { projectRepository } from "@/server/repositories/project-repository";
import { requireUser } from "@/server/auth/require-user";
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
  }
};
