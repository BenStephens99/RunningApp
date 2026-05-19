import { useInvalidateMutation } from "./useInvalidateMutation";
import { useServerFn } from "@tanstack/react-start";
import {
  addMultipleRuns,
  deleteAllRuns,
  deleteRun,
  generateRunInsights,
  updateRun,
} from "~/serverFunctions";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { useQueryClient } from "@tanstack/react-query";
import { Run, RunPlan, StravaActivity } from "~/types";

export function useDeleteRun(planId: number | string) {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteRun),
    queryKey: QueryCacheKeys.runPlan(planId.toString()),
  });
}

export function useUpdateRun(planId: number | string) {
  return useInvalidateMutation({
    mutationFn: useServerFn(updateRun),
    queryKey: QueryCacheKeys.runPlan(planId.toString()),
  });
}

export function useAddMultipleRuns() {
  return useInvalidateMutation({
    mutationFn: useServerFn(addMultipleRuns),
  });
}

export function useDeleteAllRuns(planId: number | string) {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteAllRuns),
    queryKey: QueryCacheKeys.runPlan(planId.toString()),
  });
}

export function useGenerateRunInsights(planId: number | string) {
  const queryClient = useQueryClient();

  return useInvalidateMutation({
    mutationFn: useServerFn(generateRunInsights),
    queryKey: QueryCacheKeys.runPlan(planId.toString()),
  });
}

export type GenerateRunInsightsMutationResult = ReturnType<
  typeof useGenerateRunInsights
>;