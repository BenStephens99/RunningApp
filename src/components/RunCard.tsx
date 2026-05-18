import {
  Card,
  Group,
  Stack,
  Text,
  ActionIcon,
  Skeleton,
  Menu,
  Box,
  Table,
  Divider,
  Loader,
} from "@mantine/core";
import {
  IconPencil,
  IconRun,
  IconTrash,
  IconBrandStrava,
  IconClock,
  IconBrandSpeedtest,
  IconDotsVertical,
  IconDots,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useGenerateRunInsights } from "~/hooks/runs";
import { Run, StravaActivity } from "~/types";
import { formatDistance, formatTime, formatPace } from "~/utils/formatting";

interface RunCardProps {
  run: Run;
  isNextRun: boolean;
  stravaActivity: StravaActivity | null;
  isLoadingStravaActivities: boolean;
  onStravaClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  setCardRef: (element: HTMLDivElement | null) => void;
}

export function RunCard({
  run,
  isNextRun,
  stravaActivity,
  onStravaClick,
  onEditClick,
  onDeleteClick,
  setCardRef,
}: RunCardProps) {
  const generateRunInsights = useGenerateRunInsights(run.plan_id)

  return (
    <div ref={setCardRef} style={{ scrollMargin: "175px" }}>
      <Card
        shadow="xs"
        radius="md"
        bg='var(--mantine-primary-color-6)'
        withBorder
        c={'var(--mantine-color-gray-3)'}
        style={{
          borderColor: isNextRun
            ? "var(--mantine-color-blue-7)"
            : "var(--mantine-primary-color-5)",
          borderWidth: isNextRun ? 2 : 1,
        }}
      >
        <>
          <Stack gap="sm">
            <Group gap="md" wrap="nowrap" align="center">
              <ActionIcon
                variant={run.strava_link ? "filled" : "light"}
                size="lg"
                color={run.strava_link ? "green" : "orange"}
                bg={run.strava_link ? "green.6" : 'var(--mantine-primary-color-4)'}
                radius="lg"
                onClick={onStravaClick}
              >
                <IconBrandStrava size={20} />
              </ActionIcon>
              <Text fz="xs">{dayjs(run.run_date).format("ddd, DD MMMM YYYY")}</Text>
              <Box ml="auto">
                <Menu>
                  <Menu.Target>
                    <ActionIcon variant="subtle" bg="transparent" color="gray" size="sm">
                      <IconDots size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconPencil size={20} />}
                      onClick={onEditClick}
                    >
                      Edit
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTrash size={20} />}
                      onClick={onDeleteClick}
                      color="red"
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Box>
            </Group>
            {run.notes && (
              <Text fz="sm" lh={1.2}>{run.notes}</Text>
            )}
            <Group justify="flex-start" gap="lg">
              <Stack gap="0">
                <Text fz="xs" fw={500} c="dimmed">Distance</Text>
                <Text fz="md" fw={500}>{run.run_length} km</Text>
              </Stack>
              {run.pace && (
                <Stack gap="0">
                  <Text fz="xs" fw={500} c="dimmed">Pace</Text>
                  <Text fz="md" fw={500}>{run.pace}</Text>
                </Stack>
              )}
            </Group>
            {run.strava_link && (
              <Card shadow="xs" radius="md" bg='var(--mantine-primary-color-5)' c='var(--mantine-color-gray-3)'>
                <Group justify="flex-start" gap="lg" align="center">
                  {stravaActivity?.distance && (
                    <Stack gap="0">
                      <Text fz="xs" fw={500} c="dimmed">Distance</Text>
                      <Text fz="sm" fw={500}>{formatDistance(stravaActivity?.distance)} km</Text>
                    </Stack>
                  )}
                  {stravaActivity?.moving_time && (
                    <Stack gap="0">
                      <Text fz="xs" fw={500} c="dimmed">Pace</Text>
                      <Text fz="sm" fw={500}>{formatPace(stravaActivity?.distance, stravaActivity?.moving_time)}</Text>
                    </Stack>
                  )}
                  {stravaActivity?.moving_time && (
                    <Stack gap="0">
                      <Text fz="xs" fw={500} c="dimmed">Time</Text>
                      <Text fz="sm" fw={500}>{formatTime(stravaActivity?.elapsed_time)}</Text>
                    </Stack>
                  )}
                </Group>
                {(run.ai_insights || generateRunInsights.isPending) && (
                  <>
                    {generateRunInsights.isPending ? (
                      <>
                        <Box h="75px">
                          <Group h="100%" align="center" justify="center">
                            <Loader type="dots" color="var(--mantine-color-green-5)" />
                          </Group>
                        </Box>
                      </>
                    ) : (
                      <Text fz="xs" mt="sm" lh={1.2} fw="500">{run.ai_insights}</Text>
                    )}
                  </>
                )}
              </Card>
            )}

          </Stack>
        </>
      </Card>
    </div>
  );
}
