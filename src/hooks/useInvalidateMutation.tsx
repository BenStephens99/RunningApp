import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  QueryKey,
  InvalidateQueryFilters,
} from "@tanstack/react-query";
import _ from "lodash";

type InvalidateMutationOptions<TData, TError, TVariables, TContext> =
  UseMutationOptions<TData, TError, TVariables, TContext> & {
    queryKey?:
      | QueryKey
      | ((data: TData, variables: TVariables, context: TContext) => QueryKey);
    queryKeys?: QueryKey[];
    refetchType?: InvalidateQueryFilters["refetchType"];
  };

export function useInvalidateMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(options?: InvalidateMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();

  const refetchType: InvalidateQueryFilters["refetchType"] = _.isNil(
    options?.refetchType
  )
    ? "active"
    : options?.refetchType;

  return useMutation({
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      if (options?.queryKey) {
        const queryKey: QueryKey = _.isFunction(options.queryKey)
          ? options.queryKey(data, variables, context)
          : options.queryKey;

        queryClient.invalidateQueries({
          queryKey,
          refetchType,
        });
      }

      if (options?.queryKeys) {
        options.queryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({
            queryKey,
            refetchType,
          });
        });
      }

      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
