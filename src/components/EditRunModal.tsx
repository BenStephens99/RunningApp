import {
  Button,
  Group,
  Modal,
  NumberInput,
  Text,
  Stack,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { DatePickerInput } from "@mantine/dates";
import { Run } from "~/types";

export function EditRunModal({
  opened,
  onClose,
  run,
  onSave,
  isLoading,
}: {
  opened: boolean;
  onClose: () => void;
  run: Run | null;
  onSave: (data: { id: string; run_length: number; run_date: string }) => void;
  isLoading?: boolean;
}) {
  const [runLength, setRunLength] = useState<number>(0);
  const [runDate, setRunDate] = useState<Date | null>(null);

  // Update form when run changes
  useEffect(() => {
    if (run) {
      setRunLength(run.run_length);
      setRunDate(new Date(run.run_date));
    }
  }, [run]);

  const handleSave = () => {
    if (!run || !runDate) return;

    // Ensure runDate is a Date object - DatePickerInput can return Date | null | string
    let dateObj: Date;
    if (runDate instanceof Date) {
      dateObj = runDate;
    } else if (typeof runDate === 'string') {
      dateObj = new Date(runDate);
    } else {
      // Fallback - shouldn't happen but be safe
      return;
    }
    
    // Validate the date is valid
    if (isNaN(dateObj.getTime())) {
      return;
    }
    
    onSave({
      id: run.id,
      run_length: runLength,
      run_date: dateObj.toISOString(),
    });
  };

  const handleClose = () => {
    // Reset form when closing
    if (run) {
      setRunLength(run.run_length);
      setRunDate(new Date(run.run_date));
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw="bold" fz="lg">
          Edit Run
        </Text>
      }
      size="md"
    >
      <Stack gap="md">
        <NumberInput
          label="Distance (km)"
          value={runLength}
          onChange={(value) => setRunLength(value as number)}
          placeholder="Enter distance"
          min={0}
          step={0.1}
          decimalScale={1}
        />
        <DatePickerInput
          label="Date"
          value={runDate}
          onChange={(date) => setRunDate(date)}
          placeholder="Select date"
          w="100%"
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={handleClose} variant="default">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="filled"
            loading={isLoading}
            disabled={!runDate || runLength <= 0}
          >
            Save Changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

