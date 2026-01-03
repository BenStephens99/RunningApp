import { useEffect } from "react";
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
  }) => void;
}

export function useAutoLinkStrava(
  stravaActivities: StravaActivity[] | undefined,
  runs: Run[] | undefined,
  updateRun: UpdateRunMutation
) {
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

      if (matchingActivity) {
        updateRun.mutate({
          data: {
            id: run.id,
            run_length: run.run_length,
            run_date: run.run_date,
            strava_link: matchingActivity.id.toString(),
          },
        });
      }
    });
  }, [stravaActivities, runs, updateRun]);
}

