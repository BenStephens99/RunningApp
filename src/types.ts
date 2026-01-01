export type Run = {
  id: string;
  run_length: number;
  run_date: string;
  user_id: string;
  completed: boolean;
};

export type RunPayload = {
  run_length: number;
  run_date: string;
  completed: boolean | null;
};
