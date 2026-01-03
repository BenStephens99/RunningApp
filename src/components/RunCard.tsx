import {
  Card,
  Group,
  Stack,
  Text,
  ActionIcon,
  Skeleton,
} from "@mantine/core";
import {
  IconPencil,
  IconRun,
  IconTrash,
  IconBrandStrava,
  IconClock,
  IconBrandSpeedtest,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { Run, StravaActivity } from "~/types";
import { formatDistance, formatTime, formatPace } from "~/utils/formatting";

interface RunCardProps {
  run: Run;
  isNextRun: boolean;
  stravaActivity: StravaActivity | null;
  isLoadingStravaActivities: boolean;
  editMode: boolean;
  onStravaClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  setCardRef: (element: HTMLDivElement | null) => void;
}

export function RunCard({
  run,
  isNextRun,
  stravaActivity,
  isLoadingStravaActivities,
  editMode,
  onStravaClick,
  onEditClick,
  onDeleteClick,
  setCardRef,
}: RunCardProps) {
  return (
    <div
      ref={setCardRef}
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
            onClick={onStravaClick}
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
            {isLoadingStravaActivities && run.strava_link && (
              <Skeleton height={20} width={100} />
            )}
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
                <ActionIcon variant="light" onClick={onEditClick}>
                  <IconPencil size={20} />
                </ActionIcon>
                <ActionIcon variant="light" c="red" onClick={onDeleteClick}>
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
}

