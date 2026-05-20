import { ActionIcon, Group } from "@mantine/core";
import { IconList, IconMessageCircle, IconPlus } from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CreatePlanModal } from "./CreatePlanModal";
import { useDisclosure } from "@mantine/hooks";

export function Footer() {
  const [createPlanOpened, { open: openCreatePlan, close: closeCreatePlan }] =
    useDisclosure(false);

  const isHome = useRouterState({
    select: (state) => state.location.pathname === "/plan",
  });

  return (
    <>
      <CreatePlanModal opened={createPlanOpened} onClose={closeCreatePlan} />
      <Group justify="center" align="center" h="100%" gap="xl">
        {isHome ? (
          <ActionIcon
            size="xl"
            color="var(--mantine-primary-color-4)"
            radius="xl"
            onClick={openCreatePlan}
            aria-label="Create plan"
          >
            <IconPlus size={20} />
          </ActionIcon>
        ) : (
          <ActionIcon
            component={Link}
            to="/plan"
            size="xl"
            color="var(--mantine-primary-color-4)"
            radius="xl"
            aria-label="Back to plans"
          >
            <IconList size={20} />
          </ActionIcon>
        )}
        <ActionIcon
          component={Link}
          to="/chats"
          size="xl"
          color="var(--mantine-primary-color-4)"
          radius="xl"
          aria-label="Chats"
        >
          <IconMessageCircle size={20} />
        </ActionIcon>
      </Group>
    </>
  );
}