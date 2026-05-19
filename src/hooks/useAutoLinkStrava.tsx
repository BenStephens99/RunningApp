import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import { Run, StravaActivity } from "~/types";

interface UpdateRunMutation {
  mutate: (variables: {
    data: {
      id: string;
      run_length: number;
      run_date: string;
      strava_link: string | null;
    };
  }, options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => void;
}

export interface GenerateRunInsightsMutation {
  mutate: (variables: {
    data: {
      run: Partial<Run>;
      stravaActivity: StravaActivity;
    };
  }, options?: {
    onSuccess?: () => void;
    onError?: () => void;
  }) => void;
}

export function useAutoLinkStrava(
  stravaActivities: StravaActivity[] | undefined,
  runs: Run[] | undefined,
  updateRun: UpdateRunMutation,
  generateRunInsights: GenerateRunInsightsMutation
) {
  const linkingRunIdsRef = useRef(new Set<string>());
  const generatingInsightsRunIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!stravaActivities || !runs || runs.length === 0) {
      return;
    }

    const unlinkedRuns = runs.filter((run) => !run.strava_link);

    unlinkedRuns.forEach((run) => {
      const runDate = dayjs(run.run_date).startOf("day");

      const matchingActivity = stravaActivities.find((activity) => {
        const activityDate = dayjs(activity.start_date).startOf("day");
        return activityDate.isSame(runDate, "day");
      });

      if (matchingActivity && !linkingRunIdsRef.current.has(run.id)) {
        linkingRunIdsRef.current.add(run.id);
        updateRun.mutate(
          {
            data: {
              id: run.id,
              run_length: run.run_length,
              run_date: run.run_date,
              strava_link: matchingActivity.id.toString(),
            },
          },
          {
            onSuccess: () => {
              if (run.ai_insights || generatingInsightsRunIdsRef.current.has(run.id)) {
                return;
              }

              generatingInsightsRunIdsRef.current.add(run.id);
              generateRunInsights.mutate(
                {
                  data: {
                    run: {
                      ...run,
                      strava_link: matchingActivity.id.toString(),
                    },
                    stravaActivity: matchingActivity,
                  },
                },
                {
                  onSuccess: () => {
                    generatingInsightsRunIdsRef.current.delete(run.id);
                  },
                  onError: () => {
                    generatingInsightsRunIdsRef.current.delete(run.id);
                  },
                }
              );
            },
          }
        );
      }
    });

    // Clear any ids that are now linked in current data
    for (const run of runs) {
      if (run.strava_link) {
        linkingRunIdsRef.current.delete(run.id);
      }
      if (run.ai_insights) {
        generatingInsightsRunIdsRef.current.delete(run.id);
      }
    }
  }, [stravaActivities, runs, updateRun, generateRunInsights]);
}

