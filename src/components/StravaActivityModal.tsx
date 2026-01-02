import {
  Button,
  Modal,
  Text,
  Stack,
  Card,
  Group,
  Loader,
  Alert,
} from "@mantine/core";
import { useServerFn } from "@tanstack/react-start";
import {
  getStravaAuthUrl,
  getStravaActivities,
  getStravaAccessToken,
} from "~/serverFunctions";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { IconAlertCircle, IconClock, IconRun } from "@tabler/icons-react";
import {
  formatDistance,
  formatTimeShort,
  formatPace,
} from "~/utils/formatting";
import styles from "./StravaActivityModal.module.css";

export function StravaActivityModal({
  opened,
  onClose,
  runId,
  onSelect,
}: {
  opened: boolean;
  onClose: () => void;
  runId: string;
  onSelect: (activityId: number) => void;
}) {
  const [needsAuth, setNeedsAuth] = useState(false);
  const getAuthUrl = useServerFn(getStravaAuthUrl);
  const getActivities = useServerFn(getStravaActivities);
  const getToken = useServerFn(getStravaAccessToken);

  // Check if user has Strava connected
  const {
    data: tokenData,
    isLoading: tokenLoading,
    refetch: refetchToken,
  } = useQuery({
    queryKey: ["strava-token"],
    queryFn: () => getToken(),
    enabled: opened,
  });

  // Refetch token when modal opens (in case user just connected)
  useEffect(() => {
    if (opened) {
      refetchToken();
    }
  }, [opened, refetchToken]);

  // Fetch activities if token exists
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: ["strava-activities"],
    queryFn: () => getActivities(),
    enabled: opened && tokenData?.hasToken === true,
  });

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

  const handleSelectActivity = (activityId: number) => {
    onSelect(activityId);
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
            <Text fw="bold" fz="sm">
              Select an activity to link:
            </Text>
            {activities.length === 0 ? (
              <Alert color="yellow">
                No activities found. Make sure you have activities in your
                Strava account.
              </Alert>
            ) : (
              <Stack gap="sm">
                {activities.map((activity) => (
                  <Card
                    key={activity.id}
                    shadow="xs"
                    padding="sm"
                    className={styles.activityCard}
                    onClick={() => handleSelectActivity(activity.id)}
                    withBorder
                  >
                    <Stack gap="xs">
                      <Group align="center" gap="xs">
                        <Text fz="sm" fw="bold">
                          {dayjs(activity.start_date).format(
                            "MMM DD, YYYY HH:mm"
                          )}
                        </Text>
                        -
                        <Text fz="xs" c="dimmed">
                          {activity.name || "Untitled Activity"}
                        </Text>
                      </Group>
                      <Group gap="md">
                        <Group gap="xs" align="center">
                          <Group gap="4px" align="center">
                            <IconClock
                              size={14}
                              color="var(--mantine-color-gray-6)"
                            />
                            <Text fz="sm" c="dimmed">
                              {formatTimeShort(activity.moving_time)}
                            </Text>
                          </Group>
                          <IconRun
                            size={14}
                            color="var(--mantine-color-gray-6)"
                          />
                          <Text fz="sm" c="dimmed">
                            {formatDistance(activity.distance)} km
                          </Text>
                        </Group>
                        <Group gap="4px" align="center">
                          <Text fz="sm" c="dimmed">
                            {formatPace(
                              activity.distance,
                              activity.moving_time
                            )}
                          </Text>
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                ))}
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
