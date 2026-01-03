import { Button } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";

interface EmptyStateProps {
  onCreatePlan: () => void;
}

export function EmptyState({ onCreatePlan }: EmptyStateProps) {
  return (
    <Button
      mt="20vh"
      w="fit-content"
      mx="auto"
      size="lg"
      onClick={onCreatePlan}
      radius="xl"
      rightSection={<IconPencil size={24} />}
    >
      Create plan
    </Button>
  );
}

