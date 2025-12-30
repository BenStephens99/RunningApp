import { Button, Card, Group, Modal, NumberInput } from "@mantine/core";
import { Stack } from "@mantine/core";
import { useState } from "react";
import { RunPayload } from "~/types";
import { DatePickerInput } from "@mantine/dates";
import { IconTrash } from "@tabler/icons-react";

export function CreatePlanModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [runs, setRuns] = useState<RunPayload[]>([]);

  const addRun = () => {
    setRuns([...runs, { run_length: 0, run_date: new Date().toISOString() }]);
  };

  const removeRun = (run: RunPayload) => {
    setRuns(runs.filter((r) => r.run_date !== run.run_date));
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Plan" size="lg">
      <Card>
        <Card.Section withBorder>
          <Stack>
            {runs.map((run) => (
              <RunCard key={run.run_date} run={run} onRemove={removeRun} />
            ))}
            <Button onClick={addRun} variant="light" w="100%" mb="xs">
              Add run
            </Button>
          </Stack>
        </Card.Section>
        <Card.Section pt="md">
          <Group justify="flex-end" gap="xs">
            <Button onClick={onClose} variant="default">
              Cancel
            </Button>
            <Button onClick={onClose} variant="primary">
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
      <Group wrap="nowrap">
        <NumberInput
          value={runLength}
          min={0}
          max={100}
          onChange={(value) => setRunLength(value as number)}
        />
        <DatePickerInput
          value={runDate}
          w="100%"
          onChange={(value) => setRunDate(value as unknown as Date)}
        />
        <ActionIcon onClick={() => onRemove(run)}>
          <IconTrash />
        </ActionIcon>
      </Group>
    </Card>
  );
}
