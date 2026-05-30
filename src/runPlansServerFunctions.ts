import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";
import { Run, RunPlan, RunPlanListItem } from "./types";

export const getRunPlans = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("run_plans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!rows?.length) return [] as RunPlanListItem[];

  const finalRunIds = [
    ...new Set(
      rows.map((row) => row.final_run).filter((id): id is string => !!id)
    ),
  ];

  const runsById = new Map<string, Run>();
  if (finalRunIds.length > 0) {
    const { data: finalRuns, error: runsError } = await supabase
      .from("runs")
      .select("*")
      .in("id", finalRunIds);
    if (runsError) throw runsError;
    for (const run of finalRuns ?? []) {
      runsById.set(run.id, run as Run);
    }
  }

  return rows.map((row) => ({
    ...row,
    runs: [],
    final_run: row.final_run ? runsById.get(row.final_run) ?? null : null,
  })) as RunPlanListItem[];
});

export const getRunPlan = createServerFn({ method: "GET" })
  .inputValidator((d: { planId: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const [planResult, runsResult] = await Promise.all([
      supabase.from("run_plans").select("*").eq("id", data.planId).single(),
      supabase
        .from("runs")
        .select("*")
        .eq("plan_id", data.planId)
        .order("run_date", { ascending: true }),
    ]);
    if (planResult.error) throw planResult.error;
    if (runsResult.error) throw runsResult.error;
    return {
      ...planResult.data,
      runs: (runsResult.data ?? []) as Run[],
    } as RunPlan;
  });

export const createRunPlan = createServerFn({ method: "POST" })
  .inputValidator((d: { name?: string; llm_message_id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    const { data: row, error } = await supabase
      .from("run_plans")
      .insert({
        created_by: user.id,
        name: data.name,
        llm_message_id: data.llm_message_id,
      })
      .select()
      .single();
    if (error) throw error;
    return row as RunPlan;
  });

export const deleteRunPlan = createServerFn({ method: "POST" })
  .inputValidator((d: { plan_id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("run_plans")
      .delete()
      .eq("id", data.plan_id);
    if (error) throw error;
    return data;
  });

export const updateRunPlan = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { plan_id: string; name?: string; final_run?: string }) => d
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("run_plans")
      .update({ name: data.name, final_run: data.final_run })
      .eq("id", data.plan_id);
    if (error) throw error;

    return row;
  });
