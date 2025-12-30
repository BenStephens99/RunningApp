import {
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  ActionIcon,
  Text,
  Divider,
  Box,
} from "@mantine/core";
import { Stack } from "@mantine/core";
import { useState } from "react";
import { RunPayload } from "~/types";
import { DatePickerInput } from "@mantine/dates";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useAddMultipleRuns } from "~/hooks/runs";

export function CreatePlanModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [runs, setRuns] = useState<RunPayload[]>([]);

  const addMultipleRuns = useAddMultipleRuns();

  const addRun = () => {
    setRuns([...runs, { run_length: 5, run_date: new Date().toISOString() }]);
  };

  const removeRun = (run: RunPayload) => {
    setRuns(runs.filter((r) => r.run_date !== run.run_date));
  };

  const handleSubmit = () => {
    addMultipleRuns.mutate(
      {
        data: runs,
      },
      {
        onSuccess: () => {
          onClose();
          setRuns([]);
        },
      }
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw="bold" fz="lg">
          Create Plan
        </Text>
      }
      size="lg"
    >
      <Divider p="xs" />
      <Card>
        <Card.Section withBorder pb="xs">
          <Stack gap="xs">
            <Group>
              <Text fw="bold" fz="sm">
                Distance (KM)
              </Text>
              <Text fw="bold" fz="sm" ml="xl">
                Date
              </Text>
            </Group>
            {runs.map((run) => (
              <RunCard key={run.run_date} run={run} onRemove={removeRun} />
            ))}
            <Button
              onClick={addRun}
              variant="light"
              w="100%"
              my="xs"
              rightSection={<IconPlus size={16} />}
            >
              Add run
            </Button>
          </Stack>
        </Card.Section>
        <Card.Section pt="md">
          <Group justify="flex-end" gap="xs">
            <Button onClick={onClose} variant="default">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="primary"
              loading={addMultipleRuns.isPending}
            >
              Create Plan
            </Button>
          </Group>
        </Card.Section>
      </Card>
    </Modal>
  );
}

function RunCard({
  run,
  onRemove,
}: {
  run: RunPayload;
  onRemove: (run: RunPayload) => void;
}) {
  const [runLength, setRunLength] = useState(run.run_length);
  const [runDate, setRunDate] = useState(new Date(run.run_date));

  return (
    <Card key={run.run_date} p="0">
      <Group wrap="nowrap" gap="xs">
        <NumberInput
          value={runLength}
          placeholder="Run length"
          onChange={(value) => setRunLength(value as number)}
        />
        <DatePickerInput
          value={runDate}
          onChange={(value) => setRunDate(value as unknown as Date)}
          w="100%"
        />
        <ActionIcon onClick={() => onRemove(run)} color="red" variant="light">
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
}
