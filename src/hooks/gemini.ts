import { useQuery } from "@tanstack/react-query";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { getGoogleGenAIMessage } from "~/serverFunctions";

export function useGetGoogleGenAIMessage(message: string) {
  return useQuery({
    queryKey: QueryCacheKeys.geminiMessage(message),
    queryFn: () => getGoogleGenAIMessage({ data: { message } }),
  });
}
