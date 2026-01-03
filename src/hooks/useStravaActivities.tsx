import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStravaActivities } from "~/serverFunctions";
import { StravaActivity } from "~/types";

export function useStravaActivities() {
  const getActivities = useServerFn(getStravaActivities);
  const { data: stravaActivities, isLoading } = useQuery({
    queryKey: ["strava-activities-all"],
    queryFn: () => getActivities(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activitiesMap = useMemo(() => {
    if (!stravaActivities) return new Map<number, StravaActivity>();
    const map = new Map<number, StravaActivity>();
    stravaActivities.forEach((activity) => {
      map.set(activity.id, activity);
    });
    return map;
  }, [stravaActivities]);

  return {
    stravaActivities,
    activitiesMap,
    isLoadingStravaActivities: isLoading,
  };
}

