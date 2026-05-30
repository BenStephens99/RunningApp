import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";
import { MessageHistory } from "./types";

export const addMessageToHistory = createServerFn({ method: "POST" })
  .inputValidator((d: { message: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: row, error } = await supabase
      .from("llm_plan_messages")
      .insert({
        message: data.message,
        status: "generating",
        user_id: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    if (!row) throw new Error("Failed to insert message");
    return row as MessageHistory;
  });

export const updateMessageHistory = createServerFn({ method: "POST" })
  .inputValidator((d: Partial<MessageHistory>) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("llm_plan_messages")
      .update({
        status: data.status,
        raw_response: data.raw_response,
        formatted_response: data.formatted_response,
      })
      .eq("id", data.id);
    if (error) throw error;
    return data;
  });

export const getUnconfirmedPlans = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("llm_plan_messages")
      .select("*")
      .in("status", ["awaiting_user_confirmation", "generating"])
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows as MessageHistory[];
  }
);

export const markPlanAsDiscarded = createServerFn({ method: "POST" })
  .inputValidator((d: { plan_id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("llm_plan_messages")
      .update({
        status: "user_rejected",
      })
      .eq("id", data.plan_id);
    if (error) throw error;
    return data;
  });

export const markPlanAsCompleted = createServerFn({ method: "POST" })
  .inputValidator((d: { plan_id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("llm_plan_messages")
      .update({
        status: "completed",
      })
      .eq("id", data.plan_id);
    if (error) throw error;
    return data;
  });
