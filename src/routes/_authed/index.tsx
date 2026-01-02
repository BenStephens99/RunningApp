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
import { useDisclosure } from "@mantine/hooks";
import {
  IconPencil,
  IconRun,
  IconTrash,
  IconBrandStrava,
  IconClock,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useUpdateRun } from "~/hooks/runs";
import { useEditing } from "~/contexts/EditingContext";
import { useEffect, useRef, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getStravaActivities } from "~/serverFunctions";
import { useQuery } from "@tanstack/react-query";
import { StravaActivity } from "~/types";

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

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  return (
    <Stack>
      {groupedRuns.map(({ weekNumber, runs: weekRuns }) => (
        <Stack key={weekNumber} gap="sm">
          <Title order={3} mt={weekNumber === 1 ? 0 : "md"}>
            Week {weekNumber}
          </Title>
          {weekRuns.map((run) => {
            const isNextRun = run.id === nextRunId;
            // Find matching Strava activity if strava_link exists
            const stravaActivity = run.strava_link
              ? activitiesMap.get(parseInt(run.strava_link))
              : null;

            console.log(stravaActivity);

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
                    <Text fw="bold" fz="md">
                      {run.run_length} km
                    </Text>
                    <Stack gap="4px">
                      <Text fz="sm">
                        {dayjs(run.run_date).format("dddd, DD MMMM YYYY")}
                      </Text>
                      <Group>
                        {stravaActivity && (
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
                          </Group>
                        )}
                      </Group>
                    </Stack>
                    <Group ml="auto">
                      {editMode && (
                        <ActionIcon.Group>
                          <ActionIcon variant="light" size="lg">
                            <IconPencil size={20} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            c="red"
                            size="lg"
                            onClick={() =>
                              deleteRun.mutate({ data: { id: run.id } })
                            }
                          >
                            <IconTrash size={20} />
                          </ActionIcon>
                        </ActionIcon.Group>
                      )}
                    </Group>
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
          onSelect={(activityId) => {
            const run = runs.data?.find((r) => r.id === stravaModalRunId);
            if (run) {
              // Link the Strava activity (this marks the run as completed)
              updateRun.mutate({
                data: {
                  id: run.id,
                  run_length: run.run_length,
                  run_date: run.run_date,
                  strava_link: activityId.toString(),
                },
              });
            }
          }}
        />
      )}
    </Stack>
  );
}
