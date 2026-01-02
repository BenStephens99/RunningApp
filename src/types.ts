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
