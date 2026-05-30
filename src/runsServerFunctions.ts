import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";
import { CURRENT_MODEL, gemini } from "./geminiServerClient";
import { CreateRunPayload, Run, StravaActivity } from "./types";

export const getRuns = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .order("run_date", { ascending: true });
  if (error) throw error;
  return data;
});

export const deleteAllRuns = createServerFn({ method: "POST" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    const { error } = await supabase
      .from("runs")
      .delete()
      .eq("user_id", user.id);
    if (error) throw error;
    return { success: true };
  }
);

export const addRun = createServerFn({ method: "POST" })
  .inputValidator((d: CreateRunPayload) => d)
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
      .from("runs")
      .insert({
        run_length: data.run_length,
        run_date: data.run_date,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return row as Run;
  });

export const updateRun = createServerFn({ method: "POST" })
  .inputValidator((d: Partial<Run>) => d)
  .handler(async ({ data: run }) => {
    const supabase = getSupabaseServerClient();
    const { id, ...updates } = run;
    if (!id) throw new Error("Run id is required");

    const { data: row, error } = await supabase
      .from("runs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as Run;
  });

export const addMultipleRuns = createServerFn({ method: "POST" })
  .inputValidator((d: CreateRunPayload[]) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }
    const { data: rows, error } = await supabase.from("runs").insert(
      data.map((d) => ({
        run_length: d.run_length,
        run_date: d.run_date,
        user_id: user.id,
        plan_id: d.plan_id,
        pace: d.pace,
        notes: d.notes,
      }))
    );
    if (error) throw error;
    return rows;
  });

export const deleteRun = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("runs").delete().eq("id", data.id);
    if (error) throw error;
    return data;
  });

export const generateRunInsights = createServerFn({ method: "POST" })
  .inputValidator((d: { run: Partial<Run>; stravaActivity: StravaActivity }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const message = `
      You are an expert running coach, the user has a running plan they are following, below is the target information for their run and the actual strava activity information they completed.
      Generate a short message for the user to encourage them and possibly give them some tips to improve their next run. Dont make it more than 2 - 3 sentences.
      They are able to see their strava insights so dont just repeat them its fine to say their pace was impressive but dont just quote the exact numbers. 
      If they have achieved the goal or got close enough, dont suggest any tips for their next run.
      Dont start the message with "Great" or "You crushed".

      Target information:
      - Run length: ${data.run.run_length}
      - Run pace: ${data.run.pace}
      - Run notes: ${data.run.notes}

      Actual strava activity information:
      - Strava activity distance: ${data.stravaActivity.distance}
      - Strava activity time: ${data.stravaActivity.moving_time}
      - Strava activity type: ${data.stravaActivity.type}
      `;

    const response = await gemini.models.generateContent({
      model: CURRENT_MODEL,
      contents: message,
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const { data: row, error } = await supabase
      .from("runs")
      .update({ ai_insights: response.text })
      .eq("id", data.run.id)
      .select()
      .single();

    if (error) throw error;

    return row as Run;
  });
