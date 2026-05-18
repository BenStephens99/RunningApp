import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createRunPlan,
  deleteRunPlan,
  getRunPlan,
  getRunPlans,
  updateRunPlan,
} from "~/serverFunctions";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { useInvalidateMutation } from "./useInvalidateMutation";

export function useGetRunPlans() {
  return useQuery({
    queryKey: QueryCacheKeys.runPlans(),
    queryFn: useServerFn(getRunPlans),
  });
}

export function useGetRunPlan(id: string) {
  const getRunFn = useServerFn(getRunPlan);
  return useQuery({
    queryKey: QueryCacheKeys.runPlan(id),
    queryFn: () => getRunFn({ data: { planId: id } }),
  });
}


export function useCreateRunPlan() {
  return useInvalidateMutation({
    mutationFn: useServerFn(createRunPlan),
    queryKey: QueryCacheKeys.runPlans(),
  });
}

export function useDeleteRunPlan() {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteRunPlan),
    queryKey: QueryCacheKeys.runPlans(),
  });
}

export function useUpdateRunPlan() {
  return useInvalidateMutation({
    mutationFn: useServerFn(updateRunPlan),
    queryKey: QueryCacheKeys.runPlans(),
  });
}