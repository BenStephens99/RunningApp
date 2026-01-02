import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  ActionIcon,
  Checkbox,
  Title,
  ThemeIcon,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useDeleteRun, useGetRuns } from "~/hooks/runs";
import { CreatePlanModal } from "~/components/CreatePlanModal";
import { StravaActivityModal } from "~/components/StravaActivityModal";
import { EditRunModal } from "~/components/EditRunModal";
import { DeleteConfirmModal } from "~/components/DeleteConfirmModal";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPencil,
  IconRun,
  IconTrash,
  IconBrandStrava,
  IconClock,
  IconBrandSpeedtest,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useUpdateRun } from "~/hooks/runs";
import { useEditing } from "~/contexts/EditingContext";
import { useEffect, useRef, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getStravaActivities } from "~/serverFunctions";
import { useQuery } from "@tanstack/react-query";
import { StravaActivity } from "~/types";
import { formatDistance, formatTime, formatPace } from "~/utils/formatting";

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

  // Fetch Strava activities on page load
  const getActivities = useServerFn(getStravaActivities);
  const { data: stravaActivities } = useQuery({
    queryKey: ["strava-activities-all"],
    queryFn: () => getActivities(),
    retry: false, // Don't retry if user doesn't have Strava connected
    refetchOnWindowFocus: false,
  });

  // Create a map of activity ID to activity for quick lookup
  const activitiesMap = useMemo(() => {
    if (!stravaActivities) return new Map<number, StravaActivity>();
    const map = new Map<number, StravaActivity>();
    stravaActivities.forEach((activity) => {
      map.set(activity.id, activity);
    });
    return map;
  }, [stravaActivities]);

  const nextRunRef = useRef<HTMLDivElement>(null);

  const { groupedRuns, nextRunId } = useMemo(() => {
    if (!runs.data || runs.data.length === 0) {
      return { groupedRuns: [], nextRunId: null };
    }

    const sortedRuns = [...runs.data].sort(
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

    const groupedArray = Array.from(grouped.entries()).map(
      ([weekNumber, weekRuns]) => ({
        weekNumber,
        runs: weekRuns,
      })
    );

    return { groupedRuns: groupedArray, nextRunId };
  }, [runs.data]);

  useEffect(() => {
    if (nextRunId && nextRunRef.current && runs.isSuccess) {
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          nextRunRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [runs.data, nextRunId]);

  // Auto-link Strava activities to runs on the same day
  useEffect(() => {
    if (!stravaActivities || !runs.data || runs.data.length === 0) {
      return;
    }

    // Find runs without strava_link and try to match them with activities
    const unlinkedRuns = runs.data.filter((run) => !run.strava_link);

    unlinkedRuns.forEach((run) => {
      const runDate = dayjs(run.run_date).startOf("day");

      // Find a matching activity on the same day
      const matchingActivity = stravaActivities.find((activity) => {
        const activityDate = dayjs(activity.start_date).startOf("day");
        return activityDate.isSame(runDate, "day");
      });

      if (matchingActivity) {
        // Auto-link the activity to the run
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
  }, [stravaActivities, runs.data, updateRun]);

  return (
    <Stack>
      {groupedRuns.map(({ weekNumber, runs: weekRuns }) => (
        <Stack key={weekNumber} gap="sm">
          <Title order={4} mt={weekNumber === 1 ? 0 : "md"} c="dimmed">
            Week {weekNumber}
          </Title>
          {weekRuns.map((run) => {
            const isNextRun = run.id === nextRunId;
            // Find matching Strava activity if strava_link exists
            const stravaActivity = run.strava_link
              ? activitiesMap.get(parseInt(run.strava_link))
              : null;

            return (
              <div
                key={run.id}
                ref={isNextRun ? nextRunRef : null}
                style={{ scrollMargin: "175px" }}
              >
                <Card
                  shadow="xs"
                  radius="md"
                  bg={run.strava_link ? "green.0" : "white"}
                  withBorder
                  style={{
                    borderColor: isNextRun
                      ? "var(--mantine-color-blue-5)"
                      : run.strava_link
                        ? "var(--mantine-color-green-3)"
                        : "var(--mantine-color-gray-3)",
                    borderWidth: isNextRun ? 2 : 1,
                  }}
                >
                  <Group gap="lg">
                    <ActionIcon
                      variant={run.strava_link ? "filled" : "light"}
                      size="lg"
                      color={run.strava_link ? "green" : "orange"}
                      bg={run.strava_link ? "green.4" : "orange.0"}
                      onClick={() => {
                        if (run.strava_link && editMode) {
                          // Unlink if in edit mode and already linked
                          updateRun.mutate({
                            data: {
                              id: run.id,
                              run_length: run.run_length,
                              run_date: run.run_date,
                              strava_link: null,
                            },
                          });
                        } else {
                          // Open modal to link/unlink
                          setStravaModalRunId(run.id);
                          openStravaModal();
                        }
                      }}
                      title={
                        run.strava_link
                          ? editMode
                            ? "Unlink Strava activity"
                            : "Change Strava activity"
                          : "Link Strava activity"
                      }
                    >
                      <IconBrandStrava size={20} />
                    </ActionIcon>
                    <Stack gap="xs">
                      <Group>
                        <Text fw="bold" fz="md">
                          {run.run_length} km
                        </Text>
                        <Text fz="sm">
                          {dayjs(run.run_date).format("dddd, DD MMMM YYYY")}
                        </Text>
                      </Group>
                      {stravaActivity && !editMode && (
                        <Group>
                          <Group>
                            <Group gap="2px" align="center">
                              <IconClock
                                size={14}
                                color="var(--mantine-color-gray-6)"
                              />
                              <Text fz="sm" c="dimmed">
                                {formatTime(stravaActivity.moving_time)}
                              </Text>
                            </Group>
                            <Group gap="2px" align="center">
                              <IconRun
                                size={14}
                                color="var(--mantine-color-gray-6)"
                              />
                              <Text fz="sm" c="dimmed">
                                {formatDistance(stravaActivity.distance)} km
                              </Text>
                            </Group>
                            <Group gap="2px" align="center">
                              <IconBrandSpeedtest
                                size={14}
                                color="var(--mantine-color-gray-6)"
                              />
                              <Text fz="sm" c="dimmed">
                                {formatPace(
                                  stravaActivity.distance,
                                  stravaActivity.moving_time
                                )}
                              </Text>
                            </Group>
                          </Group>
                        </Group>
                      )}
                      {editMode && (
                        <Group>
                          <ActionIcon
                            variant="light"
                            onClick={() => {
                              setEditModalRunId(run.id);
                              openEditModal();
                            }}
                          >
                            <IconPencil size={20} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            c="red"
                            onClick={() => {
                              setDeleteModalRunId(run.id);
                              openDeleteModal();
                            }}
                          >
                            <IconTrash size={20} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Stack>
                    <Group ml="auto"></Group>
                  </Group>
                </Card>
              </div>
            );
          })}
        </Stack>
      ))}
      {runs.data?.length === 0 ? (
        <>
          <Button
            mt="20vh"
            w="fit-content"
            mx="auto"
            size="lg"
            onClick={() => {
              open();
            }}
            radius="xl"
            rightSection={<IconPencil size={24} />}
          >
            Create plan
          </Button>
        </>
      ) : (
        <></>
      )}
      <CreatePlanModal opened={opened} onClose={close} addMode={true} />
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
              // Link or unlink the Strava activity
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
