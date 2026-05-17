import { useInvalidateMutation } from "./useInvalidateMutation";
import { useServerFn } from "@tanstack/react-start";
import {
  addMultipleRuns,
  addRun,
  deleteAllRuns,
  deleteRun,
  getRuns,
  updateRun,
} from "~/serverFunctions";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { useGetUser } from "./auth";
import { useQuery } from "@tanstack/react-query";

export function useDeleteRun(planId: string) {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteRun),
    queryKey: QueryCacheKeys.runPlan(planId),
  });
}

export function useUpdateRun(planId: string) {
  return useInvalidateMutation({
    mutationFn: useServerFn(updateRun),
    queryKey: QueryCacheKeys.runPlan(planId),
  });
}

export function useAddMultipleRuns() {
  return useInvalidateMutation({
    mutationFn: useServerFn(addMultipleRuns),
  });
}

export function useDeleteAllRuns(planId: string) {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteAllRuns),
    queryKey: QueryCacheKeys.runPlan(planId),
  });
}
