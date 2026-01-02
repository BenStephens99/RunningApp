import { Button, Group, Modal, Text, Stack } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

export function DeleteConfirmModal({
  opened,
  onClose,
  onConfirm,
  isLoading,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
          <Text fw="bold" fz="lg">
            Delete Run
          </Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        <Text>Are you sure you want to delete this run? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="default" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="filled"
            color="red"
            loading={isLoading}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

