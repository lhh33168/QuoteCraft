import { mockProjectDetail } from "@/features/project-editor/lib/mock-project-detail";
import { workspaceProjects } from "@/features/workspace/lib/mock-workspace-projects";
import { getSupabaseServerClient } from "@/server/supabase/server";
import { buildProjectDetail, mapProjectRow } from "@/server/repositories/project-mappers";
import { calculateProjectTotal } from "@/server/services/calculate-project-total";
import type { ProjectDetail } from "@/shared/types/project";

export const projectRepository = {
  async listByUser(userId: string) {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, client_name, client_company, project_type, industry, contact_name, contact_phone, summary, background, goal, scope, raw_requirement, duration, delivery_note, remark, template_type, total_price, status, share_token, updated_at, created_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => mapProjectRow(row));
      }
    }

    return workspaceProjects;
  },
  async getById(id: string, userId: string) {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const [{ data: projectRow, error: projectError }, { data: quoteItemRows, error: quoteItemError }] =
        await Promise.all([
          supabase
            .from("projects")
            .select("id, title, client_name, client_company, project_type, industry, contact_name, contact_phone, summary, background, goal, scope, raw_requirement, duration, delivery_note, remark, template_type, total_price, status, share_token, updated_at, created_at")
            .eq("id", id)
            .eq("user_id", userId)
            .single(),
          supabase
            .from("quote_items")
            .select("id, name, description, category, unit_price, quantity, unit, subtotal, sort_order, is_preset")
            .eq("project_id", id)
            .order("sort_order", { ascending: true })
        ]);

      if (!projectError && !quoteItemError && projectRow && quoteItemRows) {
        return buildProjectDetail(projectRow, quoteItemRows);
      }
    }

    return mockProjectDetail(id);
  },
  async getByShareToken(token: string) {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .select("id, title, client_name, client_company, project_type, industry, contact_name, contact_phone, summary, background, goal, scope, raw_requirement, duration, delivery_note, remark, template_type, total_price, status, share_token, updated_at, created_at")
        .eq("share_token", token)
        .single();

      if (!projectError && projectRow) {
        const { data: quoteItemRows, error: quoteItemError } = await supabase
          .from("quote_items")
          .select("id, name, description, category, unit_price, quantity, unit, subtotal, sort_order, is_preset")
          .eq("project_id", projectRow.id)
          .order("sort_order", { ascending: true });

        if (!quoteItemError && quoteItemRows) {
          return buildProjectDetail(projectRow, quoteItemRows);
        }
      }
    }

    return mockProjectDetail(token.replace("share-", ""));
  },
  async create(userId: string, payload: ProjectDetail) {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { project, quoteItems } = payload;
      const totalPrice = calculateProjectTotal(quoteItems);

      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          title: project.title,
          client_name: project.clientName,
          client_company: project.clientCompany,
          project_type: project.projectType,
          industry: project.industry,
          contact_name: project.contactName,
          contact_phone: project.contactPhone,
          summary: project.summary,
          background: project.background,
          goal: project.goal,
          scope: project.scope,
          raw_requirement: project.rawRequirement,
          duration: project.duration,
          delivery_note: project.deliveryNote,
          remark: project.remark,
          template_type: project.templateType,
          total_price: totalPrice,
          status: project.status,
          share_token: project.shareToken
        })
        .select("id, title, client_name, client_company, project_type, industry, contact_name, contact_phone, summary, background, goal, scope, raw_requirement, duration, delivery_note, remark, template_type, total_price, status, share_token, updated_at, created_at")
        .single();

      if (!projectError && projectRow) {
        if (quoteItems.length > 0) {
          await supabase.from("quote_items").insert(
            quoteItems.map((item) => ({
              project_id: projectRow.id,
              name: item.name,
              description: item.description,
              category: item.category,
              unit_price: item.unitPrice,
              quantity: item.quantity,
              unit: item.unit,
              subtotal: item.subtotal,
              sort_order: item.sortOrder,
              is_preset: item.isPreset
            }))
          );
        }

        return this.getById(projectRow.id, userId);
      }
    }

    return payload;
  },
  async update(id: string, userId: string, payload: ProjectDetail) {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { project, quoteItems } = payload;
      const totalPrice = calculateProjectTotal(quoteItems);

      const { data: updatedProject, error: projectError } = await supabase
        .from("projects")
        .update({
          title: project.title,
          client_name: project.clientName,
          client_company: project.clientCompany,
          project_type: project.projectType,
          industry: project.industry,
          contact_name: project.contactName,
          contact_phone: project.contactPhone,
          summary: project.summary,
          background: project.background,
          goal: project.goal,
          scope: project.scope,
          raw_requirement: project.rawRequirement,
          duration: project.duration,
          delivery_note: project.deliveryNote,
          remark: project.remark,
          template_type: project.templateType,
          total_price: totalPrice,
          status: project.status,
          share_token: project.shareToken
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .single();

      if (!projectError && updatedProject) {
        await supabase.from("quote_items").delete().eq("project_id", id);

        if (quoteItems.length > 0) {
          await supabase.from("quote_items").insert(
            quoteItems.map((item) => ({
              project_id: id,
              name: item.name,
              description: item.description,
              category: item.category,
              unit_price: item.unitPrice,
              quantity: item.quantity,
              unit: item.unit,
              subtotal: item.subtotal,
              sort_order: item.sortOrder,
              is_preset: item.isPreset
            }))
          );
        }

        return this.getById(id, userId);
      }
    }

    return payload;
  },
  async remove(id: string, userId: string) {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
      return { success: true };
    }

    return { success: true };
  }
};
