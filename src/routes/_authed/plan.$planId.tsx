import { Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useDeleteRun, useUpdateRun } from "~/hooks/runs";
import { StravaActivityModal } from "~/components/StravaActivityModal";
import { EditRunModal } from "~/components/EditRunModal";
import { DeleteConfirmModal } from "~/components/DeleteConfirmModal";
import { WeekGroup } from "~/components/WeekGroup";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { useRunGrouping } from "~/hooks/useRunGrouping";
import { useStravaActivities } from "~/hooks/useStravaActivities";
import { useAutoLinkStrava } from "~/hooks/useAutoLinkStrava";
import { Run } from "~/types";
import { useGetRunPlan } from "~/hooks/runPlans";

export const Route = createFileRoute('/_authed/plan/$planId')({
  component: RunsPage,
})

function RunsPage() {
  const planId = Route.useParams().planId;
  const runPlan = useGetRunPlan(planId);
  const updateRun = useUpdateRun(planId);
  const deleteRun = useDeleteRun(planId);

  const runs = runPlan.data?.runs ?? [];

  const [stravaModalRunId, setStravaModalRunId] = useState<string | null>(null);
  const [
    stravaModalOpened,
    { open: openStravaModal, close: closeStravaModal },
  ] = useDisclosure(false);
  const [editModalRunId, setEditModalRunId] = useState<string | null>(null);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [deleteModalRunId, setDeleteModalRunId] = useState<string | null>(null);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  const { stravaActivities, activitiesMap, isLoadingStravaActivities } =
    useStravaActivities();

  const { groupedRuns, nextRunId } = useRunGrouping(runs);

  const cardRefsMap = useRef(new Map<string, HTMLDivElement>());

  const setCardRef = (runId: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefsMap.current.set(runId, element);
    } else {
      cardRefsMap.current.delete(runId);
    }
  };

  useEffect(() => {
    if (nextRunId && runPlan.isSuccess) {
      const element = cardRefsMap.current.get(nextRunId);
      if (element) {
        const timeoutId = setTimeout(() => {
          requestAnimationFrame(() => {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [runPlan.data, nextRunId]);

  useAutoLinkStrava(stravaActivities, runs, updateRun);

  const handleStravaClick = (run: Run) => {
    setStravaModalRunId(run.id);
    openStravaModal();
  };

  return (
    <Stack>
      {groupedRuns.map(({ weekNumber, runs: weekRuns }) => (
        <WeekGroup
          key={weekNumber}
          weekNumber={weekNumber}
          runs={weekRuns}
          nextRunId={nextRunId}
          activitiesMap={activitiesMap}
          isLoadingStravaActivities={isLoadingStravaActivities}
          onStravaClick={handleStravaClick}
          onEditClick={(runId) => {
            setEditModalRunId(runId);
            openEditModal();
          }}
          onDeleteClick={(runId) => {
            setDeleteModalRunId(runId);
            openDeleteModal();
          }}
          setCardRef={setCardRef}
        />
      ))}
      {stravaModalRunId && (
        <StravaActivityModal
          opened={stravaModalOpened}
          onClose={() => {
            closeStravaModal();
            setStravaModalRunId(null);
          }}
          runId={stravaModalRunId}
          run={runs.find((r) => r.id === stravaModalRunId)}
          onSelect={(activityId) => {
            const run = runs.find((r) => r.id === stravaModalRunId);
            if (run) {
              updateRun.mutate({
                data: {
                  id: run.id,
                  run_length: run.run_length,
                  run_date: run.run_date,
                  strava_link: activityId ? activityId.toString() : null,
                },
              });
            }
          }}
        />
      )}
      {editModalRunId && (
        <EditRunModal
          opened={editModalOpened}
          onClose={() => {
            closeEditModal();
            setEditModalRunId(null);
          }}
          run={runs.find((r) => r.id === editModalRunId) || null}
          onSave={(data) => {
            const run = runs.find((r) => r.id === editModalRunId);
            if (run) {
              updateRun.mutate(
                {
                  data: {
                    id: data.id,
                    run_length: data.run_length,
                    run_date: data.run_date,
                    strava_link: run.strava_link,
                  },
                },
                {
                  onSuccess: () => {
                    closeEditModal();
                    setEditModalRunId(null);
                  },
                }
              );
            }
          }}
          isLoading={updateRun.isPending}
        />
      )}
      {deleteModalRunId && (
        <DeleteConfirmModal
          opened={deleteModalOpened}
          onClose={() => {
            closeDeleteModal();
            setDeleteModalRunId(null);
          }}
          onConfirm={() => {
            deleteRun.mutate(
              { data: { id: deleteModalRunId } },
              {
                onSuccess: () => {
                  closeDeleteModal();
                  setDeleteModalRunId(null);
                },
              }
            );
          }}
          isLoading={deleteRun.isPending}
        />
      )}
    </Stack>
  );
}