import { useInvalidateMutation } from "./useInvalidateMutation";
import { useServerFn } from "@tanstack/react-start";
import {
  addMultipleRuns,
  deleteAllRuns,
  deleteRun,
  generateRunInsights,
  updateRun,
} from "~/runsServerFunctions";
import { QueryCacheKeys } from "~/QueryCacheKeys";

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

export type UpdateRunMutationResult = ReturnType<
  typeof useUpdateRun
>;

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
  return useInvalidateMutation({
    mutationFn: useServerFn(generateRunInsights),
    queryKey: QueryCacheKeys.runPlan(planId.toString()),
  });
}

export type GenerateRunInsightsMutationResult = ReturnType<
  typeof useGenerateRunInsights
>;
