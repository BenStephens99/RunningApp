import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";
import { StravaActivity } from "./types";

async function getStravaTokenHelper() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasToken: false };
  }

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

  if (profile.strava_token_expires_at) {
    const expiresAt = new Date(profile.strava_token_expires_at).getTime();
    const now = Date.now();
    if (now >= expiresAt && profile.strava_refresh_token) {
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
    const state = user.id;

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

    if (!clientId || !clientSecret) {
      throw new Error("Strava credentials not configured");
    }

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
      console.error("Error storing Strava token:", upsertError);
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
    const tokenResult = await getStravaTokenHelper();
    if (!tokenResult.hasToken || !tokenResult.accessToken) {
      throw new Error(
        "No Strava access token. Please connect your Strava account."
      );
    }

    const perPage = limit || 100;

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
    const tokenResult = await getStravaTokenHelper();
    if (!tokenResult.hasToken || !tokenResult.accessToken) {
      throw new Error(
        "No Strava access token. Please connect your Strava account."
      );
    }

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
