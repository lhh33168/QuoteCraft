import { getSupabaseServerClient } from "@/server/supabase/server";

type LogAiCallInput = {
  userId?: string | null;
  projectId?: string | null;
  action: "generate_summary" | "generate_scope";
  inputSnapshot: Record<string, unknown>;
  outputText: string;
};

export async function logAiCall(input: LogAiCallInput) {
  if (!input.userId) {
    return;
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("ai_logs").insert({
    user_id: input.userId,
    project_id: input.projectId ?? null,
    action: input.action,
    input_snapshot: input.inputSnapshot,
    output_text: input.outputText
  });
}
