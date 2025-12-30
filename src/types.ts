export type Run = {
  id: string;
  run_length: number;
  run_date: string;
  user_id: string;
};

export type RunPayload = {
  run_length: number;
  run_date: string;
};
