export type Run = {
  id: string;
  run_length: number;
  run_date: string;
  user_id: string;
  strava_link?: string | null;
};

export type RunPayload = {
  run_length: number;
  run_date: string;
  strava_link?: string | null;
};

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
  }[];
  comments: string;
};

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
