export type StravaAthlete = {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city: string;
  state: string;
  country: string;
};

export type UserProfile = {
  id: string;
  active_plan: string | null;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  strava_token_expires_at: string | null;
}

export type Run = {
  id: string;
  run_length: number;
  run_date: string;
  user_id: string;
  strava_link?: string | null;
  plan_id: number;
  pace: string;
  notes: string;
  ai_insights: string | null;
};

export type CreateRunPayload = Pick<Run, "run_length" | "run_date" | "plan_id" | "pace" | "notes">;

export type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  type: string;
};

export type RunPlanPayload = {
  current_age: number;
  distance_goal: number;
  days_of_week: string[];
  start_date: string;
  race_date: string;
  additional_notes: string;
};

export type RunPlanResponse = {
  plan: {
    date: string;
    distance: number;
    pace: string;
    notes: string;
  }[];
  comments: string;
};

export type RunPlan = {
  id: string;
  created_at: string;
  created_by: string;
  status: null | "completed" | "discarded";
  name?: string;
  runs: Run[];
  final_run: Run | null;
};

export type RunPlanListItem = Omit<RunPlan, "runs">;

export type MessageHistory = {
  id: string;
  status:
    | "generating"
    | "completed"
    | "awaiting_user_confirmation"
    | "error"
    | "user_rejected";
  message: string;
  raw_response: string;
  formatted_response: RunPlanResponse;
  user_id: string;
  created_at: string;
};
