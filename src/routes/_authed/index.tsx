import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  ActionIcon,
  Checkbox,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useAddRun, useDeleteRun, useGetRuns } from "~/hooks/runs";
import { CreatePlanModal } from "~/components/CreatePlanModal";
import { useDisclosure } from "@mantine/hooks";
import { IconPencil, IconPlus, IconRun, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useUpdateRun } from "~/hooks/runs";

export const Route = createFileRoute("/_authed/")({
  component: Home,
});

function Home() {
  const runs = useGetRuns();
  const addRun = useAddRun();
  const updateRun = useUpdateRun();

  const deleteRun = useDeleteRun();

  const [opened, { open, close }] = useDisclosure(false);

  const [addMode, setAddMode] = useState(false);

  const [editMode, setEditMode] = useState(false);

  return (
    <Stack>
      {!!runs.data?.length && (
        <ActionIcon
          variant={editMode ? "filled" : "light"}
          size="lg"
          onClick={() => setEditMode(!editMode)}
        >
          <IconPencil size={20} />
        </ActionIcon>
      )}
      {runs.data?.map((run) => (
        <Card
          key={run.id}
          shadow="xs"
          radius="md"
          bg={run.completed ? "green.0" : "white"}
          withBorder
          style={{
            borderColor: run.completed
              ? "var(--mantine-color-green-3)"
              : "var(--mantine-color-gray-3)",
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
              <Text>{dayjs(run.run_date).format("dddd, DD MMMM YYYY")}</Text>
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
                    onClick={() => deleteRun.mutate({ data: { id: run.id } })}
                  >
                    <IconTrash size={20} />
                  </ActionIcon>
                </ActionIcon.Group>
              )}
            </Group>
          </Group>
        </Card>
      ))}
      {runs.data?.length === 0 ? (
        <>
          <Button
            mt="20vh"
            w="fit-content"
            mx="auto"
            size="lg"
            onClick={() => {
              setAddMode(false);
              open();
            }}
            radius="xl"
            rightSection={<IconPencil size={24} />}
          >
            Create plan
          </Button>
        </>
      ) : (
        <Button
          w="fit-content"
          mx="auto"
          size="lg"
          onClick={() => {
            setAddMode(true);
            open();
          }}
          radius="xl"
          rightSection={<IconPlus size={24} />}
        >
          Add Runs
        </Button>
      )}
      <CreatePlanModal opened={opened} onClose={close} addMode={true} />
    </Stack>
  );
}
