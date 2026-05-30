import { ActionIcon, Group } from "@mantine/core";
import { IconList, IconPlus } from "@tabler/icons-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CreatePlanModal } from "./CreatePlanModal";
import { useDisclosure } from "@mantine/hooks";

const ICON_SIZE = "50px";
const INNER_ICON_SIZE = "22px";

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
            size={ICON_SIZE}
            color="var(--mantine-primary-color-4)"
            radius="xl"
            onClick={openCreatePlan}
            aria-label="Create plan"
          >
            <IconPlus size={INNER_ICON_SIZE} />
          </ActionIcon>
        ) : (
          <ActionIcon
            component={Link}
            to="/plan"
            size={ICON_SIZE}
            color="var(--mantine-primary-color-4)"
            radius="xl"
            aria-label="Back to plans"
          >
            <IconList size={INNER_ICON_SIZE} />
          </ActionIcon>
        )}
      </Group>
    </>
  );
}
