import { Button, Card, Stack, Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useAddRun, useDeleteRun, useGetRuns } from "~/hooks/runs";
import { CreatePlanModal } from "~/components/CreatePlanModal";
import { useDisclosure } from "@mantine/hooks";
import { IconPencil } from "@tabler/icons-react";

export const Route = createFileRoute("/_authed/")({
  component: Home,
});

function Home() {
  const runs = useGetRuns();
  const addRun = useAddRun();

  const deleteRun = useDeleteRun();

  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Stack>
      {runs.data?.map((run) => (
        <Card key={run.id}>
          <Text>{run.run_length}</Text>
          <Text>{run.run_date}</Text>
          <Button onClick={() => deleteRun.mutate({ data: { id: run.id } })}>
            Delete
          </Button>
        </Card>
      ))}
      {runs.data?.length === 0 ? (
        <>
          <Button
            mt="20vh"
            w="fit-content"
            mx="auto"
            size="lg"
            onClick={open}
            radius="xl"
            rightSection={<IconPencil size={24} />}
          >
            Create plan
          </Button>
          <CreatePlanModal opened={opened} onClose={close} />
        </>
      ) : (
        <Button
          loading={addRun.isPending}
          onClick={() =>
            addRun.mutate({
              data: { run_length: 10, run_date: new Date().toISOString() },
            })
          }
        >
          Add Run
        </Button>
      )}
    </Stack>
  );
}
