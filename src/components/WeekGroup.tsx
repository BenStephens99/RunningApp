import { Stack, Title } from "@mantine/core";
import { Run, StravaActivity } from "~/types";
import { RunCard } from "./RunCard";
import type { GenerateRunInsightsMutationResult } from "~/hooks/runs";

interface WeekGroupProps {
  generateRunInsights: GenerateRunInsightsMutationResult;
  weekNumber: number;
  runs: Run[];
  nextRunId: string | null;
  activitiesMap: Map<number, StravaActivity>;
  isLoadingStravaActivities: boolean;
  onStravaClick: (run: Run) => void;
  onEditClick: (runId: string) => void;
  onDeleteClick: (runId: string) => void;
  setCardRef: (runId: string, element: HTMLDivElement | null) => void;
};

export function WeekGroup({
  generateRunInsights,
  weekNumber,
  runs,
  nextRunId,
  activitiesMap,
  isLoadingStravaActivities,
  onStravaClick,
  onEditClick,
  onDeleteClick,
  setCardRef,
}: WeekGroupProps) {
  return (
    <Stack gap="sm">
      <Title
        order={4}
        mt={weekNumber === 1 ? 0 : "md"}
        c="dimmed"
        tt="uppercase"
        fz="sm"
      >
        Week {weekNumber}
      </Title>
      {runs.map((run) => {
        const isNextRun = run.id === nextRunId;
        const stravaActivity = run.strava_link
          ? activitiesMap.get(parseInt(run.strava_link))
          : null;

        return (
          <RunCard
            generateRunInsights={generateRunInsights}
            key={run.id}
            run={run}
            isNextRun={isNextRun}
            stravaActivity={stravaActivity || null}
            isLoadingStravaActivities={isLoadingStravaActivities}
            onStravaClick={() => onStravaClick(run)}
            onEditClick={() => onEditClick(run.id)}
            onDeleteClick={() => onDeleteClick(run.id)}
            setCardRef={(element) => setCardRef(run.id, element)}
          />
        );
      })}
    </Stack>
  );
}
