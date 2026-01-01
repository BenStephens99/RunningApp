import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  ActionIcon,
  Checkbox,
  Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useDeleteRun, useGetRuns } from "~/hooks/runs";
import { CreatePlanModal } from "~/components/CreatePlanModal";
import { useDisclosure } from "@mantine/hooks";
import { IconPencil, IconRun, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useUpdateRun } from "~/hooks/runs";
import { useEditing } from "~/contexts/EditingContext";
import { useEffect, useRef, useMemo } from "react";

export const Route = createFileRoute("/_authed/")({
  component: Home,
});

function Home() {
  const runs = useGetRuns();
  const updateRun = useUpdateRun();

  const deleteRun = useDeleteRun();

  const [opened, { open, close }] = useDisclosure(false);

  const { isEditing: editMode } = useEditing();

  const nextRunRef = useRef<HTMLDivElement>(null);

  const { groupedRuns, nextRunId } = useMemo(() => {
    if (!runs.data || runs.data.length === 0) {
      return { groupedRuns: [], nextRunId: null };
    }

    const sortedRuns = [...runs.data].sort(
      (a, b) => new Date(a.run_date).getTime() - new Date(b.run_date).getTime()
    );

    const nextRun = sortedRuns.find((run) => !run.completed);
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

  return (
    <Stack>
      {groupedRuns.map(({ weekNumber, runs: weekRuns }) => (
        <Stack key={weekNumber} gap="sm">
          <Title order={3} mt={weekNumber === 1 ? 0 : "md"}>
            Week {weekNumber}
          </Title>
          {weekRuns.map((run) => {
            const isNextRun = run.id === nextRunId;
            return (
              <div
                key={run.id}
                ref={isNextRun ? nextRunRef : null}
                style={{ scrollMargin: "175px" }}
              >
                <Card
                  shadow="xs"
                  radius="md"
                  bg={run.completed ? "green.0" : "white"}
                  withBorder
                  style={{
                    borderColor: isNextRun
                      ? "var(--mantine-color-blue-5)"
                      : run.completed
                        ? "var(--mantine-color-green-3)"
                        : "var(--mantine-color-gray-3)",
                    borderWidth: isNextRun ? 2 : 1,
                  }}
                >
                  <Group>
                    <Checkbox
                      size="lg"
                      checked={run.completed}
                      color="green"
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        updateRun.mutate({
                          data: {
                            id: run.id,
                            completed: checked,
                            run_length: run.run_length,
                            run_date: run.run_date,
                          },
                        });
                      }}
                    />
                    <IconRun size={60} />
                    <Stack gap="sm">
                      <Text>
                        {dayjs(run.run_date).format("dddd, DD MMMM YYYY")}
                      </Text>
                      <Text fw="bold" fz="lg">
                        {run.run_length} km
                      </Text>
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
    </Stack>
  );
}
