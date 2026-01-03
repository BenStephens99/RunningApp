import { useQuery } from "@tanstack/react-query";
import { useInvalidateMutation } from "./useInvalidateMutation";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import {
  markPlanAsDiscarded,
  getUnconfirmedPlans,
  markPlanAsCompleted,
} from "~/serverFunctions";
import { useServerFn } from "@tanstack/react-start";

export function useGetUnconfirmedPlans() {
  return useQuery({
    queryKey: QueryCacheKeys.unconfirmedPlans(),
    queryFn: useServerFn(getUnconfirmedPlans),
  });
}

export function useMarkPlanAsDiscarded() {
  return useInvalidateMutation({
    mutationFn: useServerFn(markPlanAsDiscarded),
    queryKey: QueryCacheKeys.unconfirmedPlans(),
  });
}

export function useMarkPlanAsCompleted() {
  return useInvalidateMutation({
    mutationFn: useServerFn(markPlanAsCompleted),
    queryKey: QueryCacheKeys.unconfirmedPlans(),
  });
}
