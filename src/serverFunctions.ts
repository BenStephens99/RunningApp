import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";
import { GoogleGenAI } from "@google/genai";
import {
  MessageHistory,
  Run,
  RunPlanPayload,
  RunPlanResponse,
  StravaActivity,
  RunPlan,
  RunPlanListItem,
  CreateRunPayload,
} from "./types";

enum GEMINI_MODELS {
  GEMINI_3_1_FLASH_LITE = "gemini-3.1-flash-lite",
  GEMINI_2_5_FLASH = "gemini-2.5-flash",
}

const CURRENT_MODEL = GEMINI_MODELS.GEMINI_3_1_FLASH_LITE;

export const getSession = createServerFn({ method: "GET" })
  .inputValidator((d?: { accessToken?: string, refreshToken?: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    if (data?.accessToken && data?.refreshToken) {
      await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken
      })
    }
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session ?? null;
  })

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
    const { error, data: sessionData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        error: true,
        message: error.message,
        session: null,
      };
    }

    return {
      error: false,
      message: "Login successful",
      session: sessionData.session,
    };
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

export const signInWithGoogle = createServerFn({ method: "POST" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const redirectTo = `${baseUrl}/auth-callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    return {
      url: data.url,
    };
  }
);

export const handleGoogleCallback = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(data.code);

    if (error) {
      return {
        error: true,
        message: error.message,
        session: null,
      };
    }

    return {
      error: false,
      message: "Login successful",
      session: sessionData.session,
    };
  });

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
  .inputValidator(
    (d: Partial<Run>) => d
  )
  .handler(async ({ data: run }) => {
    const supabase = getSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("runs")
      .update(run)
      .eq("id", run.id);
    if (error) throw error;
    return row as unknown as Run;
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

// Strava helper function to get access token
async function getStravaTokenHelper() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasToken: false };
  }

  // Try to get token from user_profiles table
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select(
      "strava_access_token, strava_refresh_token, strava_token_expires_at"
    )
    .eq("user_id", user.id)
    .single();

  if (error || !profile?.strava_access_token) {
    return { hasToken: false };
  }

  // Check if token is expired and refresh if needed
  if (profile.strava_token_expires_at) {
    const expiresAt = new Date(profile.strava_token_expires_at).getTime();
    const now = Date.now();
    if (now >= expiresAt && profile.strava_refresh_token) {
      // Token expired, refresh it
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return { hasToken: false };
      }

      const refreshResponse = await fetch(
        "https://www.strava.com/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: profile.strava_refresh_token,
            grant_type: "refresh_token",
          }),
        }
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const { access_token, refresh_token, expires_at } = refreshData;

        await supabase
          .from("user_profiles")
          .update({
            strava_access_token: access_token,
            strava_refresh_token: refresh_token,
            strava_token_expires_at: expires_at
              ? new Date(expires_at * 1000).toISOString()
              : null,
          })
          .eq("user_id", user.id);

        return { hasToken: true, accessToken: access_token };
      }
    }
  }

  return { hasToken: true, accessToken: profile.strava_access_token };
}

// Strava OAuth and API functions
export const getStravaAuthUrl = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    if (!clientId) {
      throw new Error("Strava client ID not configured");
    }

    const redirectUri =
      process.env.STRAVA_REDIRECT_URI ||
      "http://localhost:3000/strava-callback";
    const scope = "activity:read";
    const state = user.id; // Use user ID as state for security

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

    return { authUrl };
  }
);

export const handleStravaCallback = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; state: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== data.state) {
      throw new Error("Invalid state or not authenticated");
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const redirectUri =
      process.env.STRAVA_REDIRECT_URI ||
      "http://localhost:3000/strava-callback";

    if (!clientId || !clientSecret) {
      throw new Error("Strava credentials not configured");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: data.code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange Strava authorization code");
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_at } = tokenData;

    // Store access token in user_profiles table (or create if doesn't exist)
    const { error: upsertError } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        strava_access_token: access_token,
        strava_refresh_token: refresh_token,
        strava_token_expires_at: expires_at
          ? new Date(expires_at * 1000).toISOString()
          : null,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      // If table doesn't exist, we'll handle it gracefully
      console.error("Error storing Strava token:", upsertError);
      // For now, we'll store it in a simple way - you may need to create the table
    }

    return { success: true };
  });

export const getStravaAccessToken = createServerFn({ method: "GET" }).handler(
  async () => {
    return await getStravaTokenHelper();
  }
);

export const getStravaActivities = createServerFn({ method: "GET" })
  .inputValidator((d?: number) => d)
  .handler(async ({ data: limit }) => {
    // Get access token
    const tokenResult = await getStravaTokenHelper();
    if (!tokenResult.hasToken || !tokenResult.accessToken) {
      throw new Error(
        "No Strava access token. Please connect your Strava account."
      );
    }

    // Use limit if provided, otherwise default to 100
    const perPage = limit || 100;

    // Fetch activities from Strava
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      throw new Error("Failed to fetch Strava activities");
    }

    const activities: StravaActivity[] = await activitiesResponse.json();
    return activities;
  });

export const getStravaAthlete = createServerFn({ method: "GET" }).handler(
  async () => {
    // Get access token
    const tokenResult = await getStravaTokenHelper();
    if (!tokenResult.hasToken || !tokenResult.accessToken) {
      throw new Error(
        "No Strava access token. Please connect your Strava account."
      );
    }

    // Fetch athlete profile from Strava
    const athleteResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );

    if (!athleteResponse.ok) {
      throw new Error("Failed to fetch Strava athlete profile");
    }

    const athlete = await athleteResponse.json();
    return athlete;
  }
);

export const disconnectStrava = createServerFn({ method: "POST" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Delete the user_profiles row for this user
    const { error } = await supabase
      .from("user_profiles")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error disconnecting Strava:", error);
      throw new Error("Failed to disconnect Strava account");
    }

    return { success: true };
  }
);

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const sendGeminiMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { message: string }) => d)
  .handler(async ({ data }) => {
    const response = await gemini.models.generateContent({
      model: CURRENT_MODEL,
      contents: data.message,
    });

    return response.text;
  });

export const generateRunInsights = createServerFn({ method: "POST" })
  .inputValidator((d: { run: Partial<Run>, stravaActivity: StravaActivity }) => d)
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

export const sendGeminiRunPlan = createServerFn({ method: "POST" })
  .inputValidator((d: RunPlanPayload) => d)
  .handler(async ({ data }) => {
    const message = `
    You are an expert running coach. Create a running plan for the following user:
    - Current age: ${data.current_age}
    - Distance goal: ${data.distance_goal}
    - Days of week: ${data.days_of_week.join(", ")}
    - Start date: ${data.start_date}
    - Race date: ${data.race_date}
    - Additional notes: ${data.additional_notes}

    The plan should be based on the user's current fitness level, age and goals.
    Feel free to add a small comments section to explain the plan. and any other relevant information.

    Make sure you generate a run for every day labled between the start date and race date based on the days of week, unless you think it should be a rest day.

    Dont include a day as 0km labled rest day, just skip adding a day if you think it should be a rest day.

    Dont forget a tapering phase. As a rough guide a half marathon would have a 10-14 day taper phase.

    For the per run notes. Say what the benefit will be (ie Long slow run to build base endurance). If its an interval session, make it clear what the intervals should be in this section 
    formatted like: "Intervals: 8 x 400m at 5:00 /km (1:30 rest between intervals)". 

    If a run is not an interval session, NEVER include pace or distance in the notes section for that run.

    Return the plan in the following JSON format only, (the date must be in the format of YYYY-MM-DD and the distance must be in kilometers and just the number, notes can be flexible, pace goal should be in the format of mm:ss /km, ): 
  {
    "plan": [
      {
        "date": "2026-01-01",
        "distance": 10,
        "pace": "5:00 /km",
        "notes": "Add any additional notes about the run here"
      }
      {
        "date": "2026-01-02",
        "distance": 10,
        "pace": "5:00 /km",
        "notes": "Add any additional notes about the run here"
      }
      ...
    ],
    "comments": "Add any additional notes about the plan here"
  }
    `;

    const messageHistory: MessageHistory = await addMessageToHistory({
      data: {
        message: message,
      },
    });

    let response: any;

    try {
      response = await gemini.models.generateContent({
        model: CURRENT_MODEL,
        contents: message,
      });
    } catch (error) {
      await updateMessageHistory({
        data: {
          id: messageHistory.id,
          status: "error",
          raw_response: (error as Error).message,
          formatted_response: {
            plan: [],
            comments: "",
          },
        },
      });
      throw new Error("Error generating Gemini response");
    }

    if (!response.text) {
      await updateMessageHistory({
        data: {
          id: messageHistory.id,
          status: "error",
          raw_response: "",
          formatted_response: {
            plan: [],
            comments: "",
          },
        },
      });
      throw new Error("No response from Gemini");
    }

    let cleanedText = response.text.trim();

    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```.*$/s, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```\s*/, "")
        .replace(/\s*```.*$/s, "");
    }

    let json: RunPlanResponse = {
      plan: [],
      comments: "",
    };

    try {
      json = JSON.parse(cleanedText);
    } catch (error) {
      await updateMessageHistory({
        data: {
          id: messageHistory.id,
          status: "error",
          raw_response: response.text,
          formatted_response: {
            plan: [],
            comments: "",
          },
        },
      });
      throw new Error("Invalid JSON response from Gemini");
    }

    await updateMessageHistory({
      data: {
        id: messageHistory.id,
        status: "awaiting_user_confirmation",
        raw_response: response.text,
        formatted_response: json,
      },
    });

    return json as RunPlanResponse;
  });

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
      supabase
        .from("run_plans")
        .select("*")
        .eq("id", data.planId)
        .single(),
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
  .inputValidator((d: { name?: string, llm_message_id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
  .inputValidator((d: { plan_id: string, name?: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("run_plans")
      .update({ name: data.name })
      .eq("id", data.plan_id);
    if (error) throw error;

    return row;
  });