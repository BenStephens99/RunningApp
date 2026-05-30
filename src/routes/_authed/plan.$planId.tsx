import { Stack } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDeleteRun, useGenerateRunInsights, useUpdateRun } from "~/hooks/runs";
import { StravaActivityModal } from "~/components/StravaActivityModal";
import { EditRunModal } from "~/components/EditRunModal";
import { DeleteConfirmModal } from "~/components/DeleteConfirmModal";
import { WeekGroup } from "~/components/WeekGroup";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { useRunGrouping } from "~/hooks/useRunGrouping";
import { useStravaActivities } from "~/hooks/useStravaActivities";
import { useAutoLinkStrava } from "~/hooks/useAutoLinkStrava";
import { Run, StravaActivity } from "~/types";
import { useGetRunPlan, useUpdateRunPlan } from "~/hooks/runPlans";
import { useQueryClient } from "@tanstack/react-query";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { useGetOrCreateRunChat } from "~/hooks/chats";

export const Route = createFileRoute('/_authed/plan/$planId')({
  component: RunsPage,
})

function RunsPage() {
  const planId = Route.useParams().planId;
  const navigate = useNavigate();
  const runPlan = useGetRunPlan(planId);
  const updateRun = useUpdateRun(planId);
  const updateRunPlan = useUpdateRunPlan();
  const generateRunInsightsMutation = useGenerateRunInsights(planId);
  const deleteRun = useDeleteRun(planId);
  const getOrCreateRunChat = useGetOrCreateRunChat(planId);
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem("last-visited-plan-id", planId);
  }, [planId]);

  const runs = runPlan.data?.runs ?? [];

  useEffect(() => {
    if (runPlan.isSuccess && !runPlan.data?.final_run) {
      updateRunPlan.mutate({
        data: {
          plan_id: planId,
          final_run: runs[runs.length - 1].id.toString(),
        },
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: QueryCacheKeys.runPlans() });
        },
      });
    }
  }, [runPlan.data]);

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

  const { groupedRuns, nextRunId, lastCompletedRunId } = useRunGrouping(runs);

  const cardRefsMap = useRef(new Map<string, HTMLDivElement>());

  const setCardRef = (runId: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefsMap.current.set(runId, element);
    } else {
      cardRefsMap.current.delete(runId);
    }
  };

  useEffect(() => {
    if (lastCompletedRunId && runPlan.isSuccess) {
      const element = cardRefsMap.current.get(lastCompletedRunId);
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
  }, [runPlan.data, lastCompletedRunId]);

  useAutoLinkStrava(stravaActivities, runs, updateRun, generateRunInsightsMutation);

  const handleStravaClick = (run: Run) => {
    setStravaModalRunId(run.id);
    openStravaModal();
  };

  const handleChatClick = async (run: Run) => {
    const chat = await getOrCreateRunChat.mutateAsync({
      data: {
        runId: run.id,
      },
    });

    navigate({
      to: "/chats/$chatId",
      params: {
        chatId: chat.id,
      },
    });
  };

  return (
    <Stack>
      {groupedRuns.map(({ weekNumber, runs: weekRuns }) => (
        <WeekGroup
          generateRunInsights={generateRunInsightsMutation}
          key={weekNumber}
          weekNumber={weekNumber}
          runs={weekRuns}
          nextRunId={nextRunId}
          activitiesMap={activitiesMap}
          isLoadingStravaActivities={isLoadingStravaActivities}
          onStravaClick={handleStravaClick}
          onChatClick={(run) => void handleChatClick(run)}
          onEditClick={(runId) => {
            setEditModalRunId(runId);
            openEditModal();
          }}
          onDeleteClick={(runId) => {
            setDeleteModalRunId(runId);
            openDeleteModal();
          }}
          openingRunChatId={
            getOrCreateRunChat.isPending
              ? getOrCreateRunChat.variables?.data.runId ?? null
              : null
          }
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
                  ai_insights: !activityId ? null : run.ai_insights,
                },
              }, {
                onSuccess: (updatedRun: Run) => {
                  if (!updatedRun.ai_insights) {
                    const stravaActivity = stravaActivities?.find((a) => a.id === activityId);
                    if (stravaActivity) {
                      generateRunInsightsMutation.mutate({
                        data: {
                          run: updatedRun,
                          stravaActivity: stravaActivity,
                        },
                      },
                      {
                        onSuccess: () => {
                          closeStravaModal();
                          setStravaModalRunId(null);
                        },
                      });
                    }
                  }
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
