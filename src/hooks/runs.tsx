import { useInvalidateMutation } from "./useInvalidateMutation";
import { useServerFn } from "@tanstack/react-start";
import { addMultipleRuns, addRun, deleteRun, getRuns } from "~/serverFunctions";
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

export function useAddMultipleRuns() {
  return useInvalidateMutation({
    mutationFn: useServerFn(addMultipleRuns),
    queryKey: QueryCacheKeys.runs(),
  });
}
