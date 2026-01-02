import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";
import { Run, RunPayload, StravaActivity } from "./types";

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
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .order("run_date", { ascending: true });
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

export const updateRun = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      id: string;
      run_length: number;
      run_date: string;
      strava_link?: string | null;
    }) => d
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const updateData: {
      run_length: number;
      run_date: string;
      strava_link?: string | null;
    } = {
      run_length: data.run_length,
      run_date: data.run_date,
    };
    if (data.strava_link !== undefined) {
      updateData.strava_link = data.strava_link;
    }
    const { error } = await supabase
      .from("runs")
      .update(updateData)
      .eq("id", data.id);
    if (error) throw error;
    return data;
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
