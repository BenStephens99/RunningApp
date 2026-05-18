import {
  Button,
  Modal,
  Text,
  Stack,
  Card,
  Group,
  Loader,
  Alert,
  Table,
  Avatar,
  ActionIcon,
} from "@mantine/core";
import { useServerFn } from "@tanstack/react-start";
import {
  getStravaAuthUrl,
  getStravaActivities,
  getStravaAccessToken,
  getStravaAthlete,
} from "~/serverFunctions";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  IconAlertCircle,
  IconClock,
  IconRun,
  IconCheck,
  IconBrandSpeedtest,
} from "@tabler/icons-react";
import {
  formatDistance,
  formatTimeShort,
  formatPace,
  formatTime,
} from "~/utils/formatting";
import styles from "./StravaActivityModal.module.css";
import { Run, StravaActivity, StravaAthlete } from "~/types";
import { QueryCacheKeys } from "~/QueryCacheKeys";

export function StravaActivityModal({
  opened,
  onClose,
  runId,
  run,
  onSelect,
}: {
  opened: boolean;
  onClose: () => void;
  runId: string;
  run?: Run;
  onSelect: (activityId: number | null) => void;
}) {
  const [needsAuth, setNeedsAuth] = useState(false);
  const getAuthUrl = useServerFn(getStravaAuthUrl);
  const getActivities = useServerFn(getStravaActivities);
  const getToken = useServerFn(getStravaAccessToken);
  const getAthlete = useServerFn(getStravaAthlete);

  const {
    data: tokenData,
    isLoading: tokenLoading,
    refetch: refetchToken,
  } = useQuery({
    queryKey: QueryCacheKeys.stravaToken(),
    queryFn: () => getToken(),
    enabled: opened,
  });



  useEffect(() => {
    if (opened) {
      refetchToken();
    }
  }, [opened, refetchToken]);

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: QueryCacheKeys.stravaActivities(),
    queryFn: () => getActivities({ data: 20 }),
    enabled: opened && tokenData?.hasToken === true,
  });

  const { data: stravaAthlete, isLoading: isLoadingStravaAthlete } = useQuery({
    queryKey: QueryCacheKeys.stravaAthlete(),
    queryFn: () => getAthlete(),
    enabled: opened && tokenData?.hasToken === true,
  });

  // Group activities by date
  const groupedActivities = useMemo(() => {
    if (!activities || activities.length === 0) {
      return { today: [], thisWeek: [], older: [] };
    }

    const today = dayjs().startOf("day");
    const weekStart = dayjs().startOf("week");

    const groups = {
      today: [] as typeof activities,
      thisWeek: [] as typeof activities,
      older: [] as typeof activities,
    };

    activities.forEach((activity) => {
      const activityDate = dayjs(activity.start_date).startOf("day");

      if (activityDate.isSame(today, "day")) {
        groups.today.push(activity);
      } else if (
        activityDate.isAfter(weekStart) ||
        activityDate.isSame(weekStart, "day")
      ) {
        groups.thisWeek.push(activity);
      } else {
        groups.older.push(activity);
      }
    });

    return groups;
  }, [activities]);

  useEffect(() => {
    if (tokenData && !tokenData.hasToken) {
      setNeedsAuth(true);
    } else {
      setNeedsAuth(false);
    }
  }, [tokenData]);

  const handleConnect = async () => {
    try {
      const { authUrl } = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error getting Strava auth URL:", error);
    }
  };

  // Get the currently linked activity ID
  const selectedActivityId = run?.strava_link
    ? parseInt(run.strava_link, 10)
    : null;

  const handleSelectActivity = (activityId: number) => {
    // If clicking on the already selected activity, unlink it
    if (selectedActivityId === activityId) {
      onSelect(null);
    } else {
      onSelect(activityId);
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw="bold" fz="lg">
          Link Strava Activity
        </Text>
      }
      size="lg"
      c='var(--mantine-color-gray-3)'
      styles={{
        header: {
          backgroundColor: 'var(--mantine-primary-color-8)',
        },
        body: {
          backgroundColor: 'var(--mantine-primary-color-8)',
        },
      }}
    >
      <Stack gap="md">
        {tokenLoading && (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        )}

        {needsAuth && !tokenLoading && (
          <Stack gap="md">
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Connect Strava"
              color="blue"
            >
              Connect your Strava account to link activities to your runs.
            </Alert>
            <Button onClick={handleConnect} fullWidth size="lg">
              Connect with Strava
            </Button>
          </Stack>
        )}

        {!needsAuth && !tokenLoading && activitiesLoading && (
          <Group justify="center" p="xl">
            <Loader />
            <Text>Loading activities...</Text>
          </Group>
        )}

        {!needsAuth &&
          !tokenLoading &&
          activitiesError &&
          !activitiesLoading && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
            >
              Failed to load Strava activities. Please try again.
            </Alert>
          )}

        {!needsAuth && !tokenLoading && activities && !activitiesLoading && (
          <Stack gap="xs">
            {activities.length === 0 ? (
              <Alert color="yellow">
                No activities found. Make sure you have activities in your
                Strava account.
              </Alert>
            ) : (
              <Stack gap="sm">
                {/* Today */}
                {groupedActivities.today.length > 0 && (
                  <Stack gap="xs">
                    <Text fw="bold" fz="sm" c="dimmed">
                      Today
                    </Text>
                    <Stack gap="xs">
                      {groupedActivities.today.map((activity) => {
                        const isSelected = selectedActivityId === activity.id;
                        return (
                          <Card
                            key={activity.id}
                            shadow="xs"
                            padding="sm"
                            className={`${styles.activityCard} ${isSelected ? styles.activityCardSelected : ""
                              }`}
                            onClick={() => handleSelectActivity(activity.id)}
                            withBorder={false}
                          >
                            <Stack gap="xs">
                              <Group align="center" gap="xs">
                                {isSelected && (
                                  <IconCheck
                                    size={18}
                                    color="var(--mantine-color-green-6)"
                                  />
                                )}
                                <Text fz="sm" fw="bold">
                                  {dayjs(activity.start_date).format(
                                    "MMM DD, YYYY HH:mm"
                                  )}
                                </Text>
                                -
                                <Text fz="xs" c="dimmed">
                                  {activity.name || "Untitled Activity"}
                                </Text>
                                {isSelected && (
                                  <Text fz="xs" c="dimmed" fs="italic">
                                    (Click to unlink)
                                  </Text>
                                )}
                              </Group>
                              <Table>
                                <Table.Tbody>
                                  <Table.Tr>
                                    <Table.Td>
                                      <Group gap="xs" align="center">
                                        <IconClock
                                          size={18}
                                          color="var(--mantine-color-gray-6)"
                                        />
                                        <Text fz="sm" c="dimmed">
                                          Time
                                        </Text>
                                      </Group>
                                    </Table.Td>
                                    <Table.Td>
                                      <Text fz="sm" c="dimmed">
                                        {formatTimeShort(activity.moving_time)}
                                      </Text>
                                    </Table.Td>
                                  </Table.Tr>
                                  <Table.Tr>
                                    <Table.Td>
                                      <Group gap="xs" align="center">
                                        <IconRun
                                          size={18}
                                          color="var(--mantine-color-gray-6)"
                                        />
                                        <Text fz="sm" c="dimmed">
                                          Distance
                                        </Text>
                                      </Group>
                                    </Table.Td>
                                    <Table.Td>
                                      <Text fz="sm" c="dimmed">
                                        {formatDistance(activity.distance)} km
                                      </Text>
                                    </Table.Td>
                                  </Table.Tr>
                                  <Table.Tr>
                                    <Table.Td>
                                      <Group gap="xs" align="center">
                                        <IconBrandSpeedtest
                                          size={18}
                                          color="var(--mantine-color-gray-6)"
                                        />
                                        <Text fz="sm" c="dimmed">
                                          Pace
                                        </Text>
                                      </Group>
                                    </Table.Td>
                                    <Table.Td>
                                      <Text fz="sm" c="dimmed">
                                        {formatPace(
                                          activity.distance,
                                          activity.moving_time
                                        )}
                                      </Text>
                                    </Table.Td>
                                  </Table.Tr>
                                </Table.Tbody>
                              </Table>
                            </Stack>
                          </Card>
                        );
                      })}
                    </Stack>
                  </Stack>
                )}

                {/* This Week */}
                {groupedActivities.thisWeek.length > 0 && (
                  <Stack gap="xs">
                    <Text fw="bold" fz="sm" c="dimmed">
                      This Week
                    </Text>
                    <Stack gap="sm">
                      {groupedActivities.thisWeek.map((activity) => {
                        const isSelected = selectedActivityId === activity.id;
                        return (
                          <ActivityCard activity={activity} isSelected={isSelected} onSelect={handleSelectActivity} stravaAthlete={stravaAthlete} />
                        );
                      })}
                    </Stack>
                  </Stack>
                )}

                {/* Older */}
                {groupedActivities.older.length > 0 && (
                  <Stack gap="xs">
                    <Text fw="bold" fz="sm" c="dimmed">
                      Older
                    </Text>
                    <Stack gap="sm">
                      {groupedActivities.older.map((activity) => {
                        const isSelected = selectedActivityId === activity.id;
                        return (
                          <ActivityCard activity={activity} isSelected={isSelected} onSelect={handleSelectActivity} stravaAthlete={stravaAthlete} />
                        );
                      })}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        )}

        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="default">
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

const ActivityCard = ({ activity, isSelected, onSelect, stravaAthlete }: { activity: StravaActivity, isSelected: boolean, onSelect: (activityId: number) => void, stravaAthlete: StravaAthlete }) => {
  return (
    <Card
      key={activity.id}
      shadow="xs"
      padding="sm"
      className={`${styles.activityCard} ${isSelected ? styles.activityCardSelected : ""
        }`}
      onClick={() => onSelect(activity.id)}
      withBorder
    >
      <Stack gap="sm">
        <Group gap="sm">
          {isSelected ? (
            <ActionIcon variant="light" size="30px" color="green" radius="lg">
              <IconCheck size={20} />
            </ActionIcon>
          ) : (
            <Avatar src={stravaAthlete.profile} alt={stravaAthlete.firstname + " " + stravaAthlete.lastname} size="30px" />
          )}
          <Stack gap="0">
            <Text fz="sm" fw="500">{stravaAthlete.firstname + " " + stravaAthlete.lastname}</Text>
            <Text fz="xs" c="dimmed" fw="500">{dayjs(activity.start_date).format("MMM DD, YYYY HH:mm")}</Text>
          </Stack>
        </Group>
        <Text fz="md" fw="500">{activity.name}</Text>
        <Group gap="xl">
          <Stack gap="0">
            <Text fz="xs" c="dimmed" fw="500">Distance</Text>
            <Text fz="sm" fw="500">{formatDistance(activity.distance)} km</Text>
          </Stack>
          <Stack gap="0">
            <Text fz="xs" c="dimmed" fw="500">Pace</Text>
            <Text fz="sm" fw="500">{formatPace(activity.distance, activity.moving_time)}</Text>
          </Stack>
          <Stack gap="0">
            <Text fz="xs" c="dimmed" fw="500">Time</Text>
            <Text fz="sm" fw="500">{formatTime(activity.moving_time)}</Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
};
