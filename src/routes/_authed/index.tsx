import { Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useDeleteRun, useGetRuns, useUpdateRun } from "~/hooks/runs";
import { CreatePlanModal } from "~/components/CreatePlanModal";
import { StravaActivityModal } from "~/components/StravaActivityModal";
import { EditRunModal } from "~/components/EditRunModal";
import { DeleteConfirmModal } from "~/components/DeleteConfirmModal";
import { WeekGroup } from "~/components/WeekGroup";
import { EmptyState } from "~/components/EmptyState";
import { useDisclosure } from "@mantine/hooks";
import { useEditing } from "~/contexts/EditingContext";
import { useEffect, useRef, useState } from "react";
import { useRunGrouping } from "~/hooks/useRunGrouping";
import { useStravaActivities } from "~/hooks/useStravaActivities";
import { useAutoLinkStrava } from "~/hooks/useAutoLinkStrava";
import { Run } from "~/types";

export const Route = createFileRoute("/_authed/")({
  component: Home,
});

function Home() {
  const runs = useGetRuns();
  const updateRun = useUpdateRun();
  const deleteRun = useDeleteRun();

  const [opened, { open, close }] = useDisclosure(false);
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

  const { isEditing: editMode } = useEditing();

  const { stravaActivities, activitiesMap, isLoadingStravaActivities } =
    useStravaActivities();

  const { groupedRuns, nextRunId } = useRunGrouping(runs.data);

  const cardRefsMap = useRef(new Map<string, HTMLDivElement>());

  const setCardRef = (runId: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefsMap.current.set(runId, element);
    } else {
      cardRefsMap.current.delete(runId);
    }
  };

  useEffect(() => {
    if (nextRunId && runs.isSuccess) {
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
  }, [runs.isSuccess, nextRunId]);

  useAutoLinkStrava(stravaActivities, runs.data, updateRun);

  const handleStravaClick = (run: Run) => {
    if (run.strava_link && editMode) {
      updateRun.mutate({
        data: {
          id: run.id,
          run_length: run.run_length,
          run_date: run.run_date,
          strava_link: null,
        },
      });
    } else {
      setStravaModalRunId(run.id);
      openStravaModal();
    }
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
          editMode={editMode}
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
      {runs.data?.length === 0 && <EmptyState onCreatePlan={open} />}
      <CreatePlanModal opened={opened} onClose={close} />
      {stravaModalRunId && (
        <StravaActivityModal
          opened={stravaModalOpened}
          onClose={() => {
            closeStravaModal();
            setStravaModalRunId(null);
          }}
          runId={stravaModalRunId}
          run={runs.data?.find((r) => r.id === stravaModalRunId)}
          onSelect={(activityId) => {
            const run = runs.data?.find((r) => r.id === stravaModalRunId);
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
          run={runs.data?.find((r) => r.id === editModalRunId) || null}
          onSave={(data) => {
            const run = runs.data?.find((r) => r.id === editModalRunId);
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
