import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";
import { Run, RunPayload } from "./types";

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data, error: _error } = await supabase.auth.getUser();

  if (!data.user?.email) {
    return null;
  }

  return {
    ...data.user,
  };
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }
  });

export const logout = createServerFn().handler(async () => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      error: true,
      message: error.message,
    };
  }

  throw redirect({
    href: "/",
  });
});

export const signup = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { email: string; password: string; redirectUrl?: string }) => d
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    throw redirect({
      href: data.redirectUrl || "/",
    });
  });

export const getRuns = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("runs").select("*");
  if (error) throw error;
  return data;
});

export const addRun = createServerFn({ method: "POST" })
  .inputValidator((d: RunPayload) => d)
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

export const addMultipleRuns = createServerFn({ method: "POST" })
  .inputValidator((d: RunPayload[]) => d)
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
      }))
    );
    if (error) throw error;
    return data;
  });

export const deleteRun = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("runs").delete().eq("id", data.id);
    if (error) throw error;
    return data;
  });
