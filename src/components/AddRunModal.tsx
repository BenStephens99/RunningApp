import { Modal, Text, Group, Stack, NumberInput, Button } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconRun } from "@tabler/icons-react";
import { useState } from "react";
import { useAddRun } from "~/hooks/runs";

export function AddRunModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const addRun = useAddRun();
  const [distance, setDistance] = useState(5);
  const [date, setDate] = useState<string | null>(new Date().toISOString());

  const handleAddRun = () => {
    if (!date || distance <= 0) return;
    addRun.mutate(
      {
        data: {
          run_length: distance,
          run_date: date,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" w="100%" wrap="nowrap">
          <IconRun size={40} />
          <Stack gap="0">
            <Text fw="bold" fz="lg">
              Add run
            </Text>
          </Stack>
        </Group>
      }
    >
      <Stack gap="md">
        <NumberInput
          label="Distance (km)"
          value={distance}
          onChange={(value) => setDistance(value as number)}
          placeholder="Enter distance"
          min={0}
          step={0.1}
          decimalScale={1}
        />
        <DateInput
          label="Date"
          value={date}
          onChange={(date) => setDate(date as string)}
          placeholder="Select date"
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="default">
            Cancel
          </Button>
          <Button
            onClick={handleAddRun}
            variant="filled"
            loading={addRun.isPending}
          >
            Add Run
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
