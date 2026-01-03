import { useMemo } from "react";
import dayjs from "dayjs";
import { Run } from "~/types";

interface GroupedRun {
  weekNumber: number;
  runs: Run[];
}

export function useRunGrouping(runs: Run[] | undefined) {
  return useMemo(() => {
    if (!runs || runs.length === 0) {
      return { groupedRuns: [], nextRunId: null };
    }

    const sortedRuns = [...runs].sort(
      (a, b) => new Date(a.run_date).getTime() - new Date(b.run_date).getTime()
    );

    const nextRun = sortedRuns.find((run) => !run.strava_link);
    const nextRunId = nextRun?.id || null;

    const grouped = new Map<number, typeof sortedRuns>();
    const firstRunDate = dayjs(sortedRuns[0].run_date);
    const firstRunWeekStart = firstRunDate.startOf("week");

    sortedRuns.forEach((run) => {
      const runDate = dayjs(run.run_date);
      const weekStart = runDate.startOf("week");
      const weekNumber = weekStart.diff(firstRunWeekStart, "week") + 1;

      if (!grouped.has(weekNumber)) {
        grouped.set(weekNumber, []);
      }
      grouped.get(weekNumber)!.push(run);
    });

    const groupedArray: GroupedRun[] = Array.from(grouped.entries()).map(
      ([weekNumber, weekRuns]) => ({
        weekNumber,
        runs: weekRuns,
      })
    );

    return { groupedRuns: groupedArray, nextRunId };
  }, [runs]);
}

