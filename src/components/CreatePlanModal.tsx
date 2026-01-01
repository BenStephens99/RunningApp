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
  addMode,
}: {
  opened: boolean;
  onClose: () => void;
  addMode: boolean;
}) {
  const [runs, setRuns] = useState<RunPayload[]>([]);

  const addMultipleRuns = useAddMultipleRuns();

  const addRun = () => {
    setRuns([
      ...runs,
      {
        run_length: 5,
        run_date: new Date().toISOString(),
        completed: false,
      },
    ]);
  };

  const removeRun = (index: number) => {
    setRuns(runs.filter((_, i) => i !== index));
  };

  const updateRun = (index: number, updates: Partial<RunPayload>) => {
    setRuns(runs.map((run, i) => (i === index ? { ...run, ...updates } : run)));
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
          {addMode ? "Add Runs" : "Create Plan"}
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
            {runs.map((run, index) => (
              <RunCard
                key={index}
                run={run}
                onRemove={() => removeRun(index)}
                onUpdate={(updates) => updateRun(index, updates)}
              />
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
              {addMode ? "Add Runs" : "Create Plan"}
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
  onUpdate,
}: {
  run: RunPayload;
  onRemove: () => void;
  onUpdate: (updates: Partial<RunPayload>) => void;
}) {
  const [runLength, setRunLength] = useState(run.run_length);
  const [runDate, setRunDate] = useState(new Date(run.run_date));

  return (
    <Card p="0">
      <Group wrap="nowrap" gap="xs">
        <NumberInput
          value={runLength}
          placeholder="Run length"
          onChange={(value) => {
            setRunLength(value as number);
            onUpdate({ run_length: value as number });
          }}
        />
        <DatePickerInput
          value={runDate}
          onChange={(date) => {
            if (date) {
              const dateObj = new Date(date as Date | string);
              setRunDate(dateObj);
              onUpdate({ run_date: dateObj.toISOString() });
            }
          }}
          w="100%"
        />
        <ActionIcon onClick={onRemove} color="red" variant="light">
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
}
