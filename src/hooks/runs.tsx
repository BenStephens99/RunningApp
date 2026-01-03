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
import { useQuery } from "@tanstack/react-query";

export function useAddRun() {
  return useInvalidateMutation({
    mutationFn: useServerFn(addRun),
    queryKey: QueryCacheKeys.runs(),
  });
}

export function useGetRuns() {
  return useQuery({
    queryKey: QueryCacheKeys.runs(),
    queryFn: useServerFn(getRuns),
  });
}

export function useDeleteRun() {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteRun),
    queryKey: QueryCacheKeys.runs(),
  });
}

export function useUpdateRun() {
  return useInvalidateMutation({
    mutationFn: useServerFn(updateRun),
    queryKey: QueryCacheKeys.runs(),
  });
}

export function useAddMultipleRuns() {
  return useInvalidateMutation({
    mutationFn: useServerFn(addMultipleRuns),
    queryKey: QueryCacheKeys.runs(),
  });
}

export function useDeleteAllRuns() {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteAllRuns),
    queryKey: QueryCacheKeys.runs(),
  });
}
