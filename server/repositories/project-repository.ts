import { mockProjectDetail } from "@/features/project-editor/lib/mock-project-detail";
import { workspaceProjects } from "@/features/workspace/lib/mock-workspace-projects";
import { createShareToken } from "@/server/projects/create-share-token";
import { isSupabaseBrowserConfigured, isSupabaseServerConfigured } from "@/server/supabase/keys";
import { getSupabaseServerClient } from "@/server/supabase/server";
import { buildProjectDetail, mapProjectRow } from "@/server/repositories/project-mappers";
import { calculateProjectTotal } from "@/server/services/calculate-project-total";
import type { ProjectDetail } from "@/shared/types/project";

function shouldUseMockMode() {
  return !isSupabaseBrowserConfigured();
}

function requireSupabaseDataClient() {
  if (shouldUseMockMode()) {
    return null;
  }

  if (!isSupabaseServerConfigured()) {
    throw new Error("Supabase 服务端数据 Key 未配置，当前无法进行真实项目读写。请配置 SUPABASE_SECRET_KEY 或 SUPABASE_SERVICE_ROLE_KEY。");
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase 服务端数据客户端初始化失败。");
  }

  return supabase;
}

function explainRepositoryError(action: string, errorMessage: string) {
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("permission denied")) {
    return `${action}失败：数据库表权限不足。请在 Supabase SQL Editor 重新执行 supabase-schema-and-rls.sql，确保 GRANT 语句已经生效。原始错误：${errorMessage}`;
  }

  return `${action}失败：${errorMessage}`;
}

export const projectRepository = {
  async listByUser(userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return workspaceProjects;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, title, client_name, client_company, project_type, industry, contact_name, contact_phone, summary, background, goal, scope, raw_requirement, duration, delivery_note, remark, template_type, total_price, status, share_token, updated_at, created_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(explainRepositoryError("读取项目列表", error.message));
    }

    return (data ?? []).map((row) => mapProjectRow(row));
  },
  async getById(id: string, userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return mockProjectDetail(id);
    }

    const [{ data: projectRow, error: projectError }, { data: quoteItemRows, error: quoteItemError }] = await Promise.all([
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

    if (projectError) {
      throw new Error(explainRepositoryError("读取项目详情", projectError.message));
    }

    if (quoteItemError) {
      throw new Error(explainRepositoryError("读取报价项", quoteItemError.message));
    }

    if (!projectRow) {
      throw new Error("项目不存在或你没有访问权限。");
    }

    return buildProjectDetail(projectRow, quoteItemRows ?? []);
  },
  async getByShareToken(token: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return mockProjectDetail(token.replace("share-", ""));
    }

    const { data: projectRow, error: projectError } = await supabase
      .from("projects")
      .select("id, title, client_name, client_company, project_type, industry, contact_name, contact_phone, summary, background, goal, scope, raw_requirement, duration, delivery_note, remark, template_type, total_price, status, share_token, updated_at, created_at")
      .eq("share_token", token)
      .single();

    if (projectError || !projectRow) {
      return mockProjectDetail(token.replace("share-", ""));
    }

    const { data: quoteItemRows, error: quoteItemError } = await supabase
      .from("quote_items")
      .select("id, name, description, category, unit_price, quantity, unit, subtotal, sort_order, is_preset")
      .eq("project_id", projectRow.id)
      .order("sort_order", { ascending: true });

    if (quoteItemError) {
      throw new Error(explainRepositoryError("读取分享报价项", quoteItemError.message));
    }

    return buildProjectDetail(projectRow, quoteItemRows ?? []);
  },
  async create(userId: string, payload: ProjectDetail) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      const totalPrice = calculateProjectTotal(payload.quoteItems);

      return {
        project: {
          ...payload.project,
          id: payload.project.id === "new-project" ? `mock-${Date.now()}` : payload.project.id,
          totalPrice,
          status: payload.project.status || "draft"
        },
        quoteItems: payload.quoteItems.map((item, index) => ({
          ...item,
          id: item.id || `mock-item-${index + 1}`,
          sortOrder: index + 1,
          subtotal: Number(item.unitPrice || 0) * Number(item.quantity || 0)
        }))
      };
    }

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

    if (projectError || !projectRow) {
      throw new Error(explainRepositoryError("创建项目", projectError?.message ?? "数据库未返回项目数据。"));
    }

    if (quoteItems.length > 0) {
      const { error: quoteItemsError } = await supabase.from("quote_items").insert(
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

      if (quoteItemsError) {
        throw new Error(explainRepositoryError("创建报价项", quoteItemsError.message));
      }
    }

    return this.getById(projectRow.id, userId);
  },
  async update(id: string, userId: string, payload: ProjectDetail) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      const totalPrice = calculateProjectTotal(payload.quoteItems);

      return {
        project: {
          ...payload.project,
          id,
          totalPrice
        },
        quoteItems: payload.quoteItems.map((item, index) => ({
          ...item,
          id: item.id || `mock-item-${index + 1}`,
          sortOrder: index + 1,
          subtotal: Number(item.unitPrice || 0) * Number(item.quantity || 0)
        }))
      };
    }

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

    if (projectError || !updatedProject) {
      throw new Error(explainRepositoryError("更新项目", projectError?.message ?? "数据库未返回项目结果。"));
    }

    const { error: deleteQuoteItemsError } = await supabase.from("quote_items").delete().eq("project_id", id);

    if (deleteQuoteItemsError) {
      throw new Error(explainRepositoryError("清理旧报价项", deleteQuoteItemsError.message));
    }

    if (quoteItems.length > 0) {
      const { error: insertQuoteItemsError } = await supabase.from("quote_items").insert(
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

      if (insertQuoteItemsError) {
        throw new Error(explainRepositoryError("保存报价项", insertQuoteItemsError.message));
      }
    }

    return this.getById(id, userId);
  },
  async remove(id: string, userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return { success: true };
    }

    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      throw new Error(explainRepositoryError("删除项目", error.message));
    }

    return { success: true };
  },
  async ensureShareToken(id: string, userId: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      const token = `share-${id}`;

      return {
        shareToken: token,
        shareUrl: `/share/${token}`
      };
    }

    const { data: projectRow, error: projectError } = await supabase
      .from("projects")
      .select("id, share_token")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (projectError || !projectRow) {
      throw new Error(explainRepositoryError("生成分享链接", projectError?.message ?? "项目不存在或无权访问。"));
    }

    if (projectRow.share_token) {
      const { error: sharedAtError } = await supabase
        .from("projects")
        .update({
          last_shared_at: new Date().toISOString(),
          status: "shared"
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (sharedAtError) {
        throw new Error(explainRepositoryError("更新分享状态", sharedAtError.message));
      }

      return {
        shareToken: projectRow.share_token,
        shareUrl: `/share/${projectRow.share_token}`
      };
    }

    const shareToken = createShareToken(id);
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({
        share_token: shareToken,
        last_shared_at: new Date().toISOString(),
        status: "shared"
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("share_token")
      .single();

    if (updateError || !updatedProject?.share_token) {
      throw new Error(explainRepositoryError("保存分享链接", updateError?.message ?? "分享链接生成失败。"));
    }

    return {
      shareToken: updatedProject.share_token,
      shareUrl: `/share/${updatedProject.share_token}`
    };
  },
  async getOwnerIdByProjectId(id: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return "mock-user-id";
    }

    const { data, error } = await supabase.from("projects").select("user_id").eq("id", id).single();

    if (error || !data?.user_id) {
      throw new Error(explainRepositoryError("读取项目归属用户", error?.message ?? "项目不存在或无权访问。"));
    }

    return data.user_id as string;
  },
  async getOwnerIdByShareToken(token: string) {
    const supabase = requireSupabaseDataClient();

    if (!supabase) {
      return "mock-user-id";
    }

    const { data, error } = await supabase.from("projects").select("user_id").eq("share_token", token).single();

    if (error || !data?.user_id) {
      throw new Error(explainRepositoryError("读取分享项目归属用户", error?.message ?? "分享项目不存在。"));
    }

    return data.user_id as string;
  }
};
