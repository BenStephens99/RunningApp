import { ActionIcon, Button, Group, Menu, Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useRouteContext } from "@tanstack/react-router";
import { CreatePlanModal } from "./CreatePlanModal";
import { AddRunModal } from "./AddRunModal";

import { useGetRuns } from "~/hooks/runs";

export function Footer() {
  const runs = useGetRuns();

  const [createPlanOpened, { open: openCreatePlan, close: closeCreatePlan }] =
    useDisclosure(false);

  const [addRunOpened, { open: openAddRun, close: closeAddRun }] =
    useDisclosure(false);

  const { user } = useRouteContext({ from: "__root__" });

  return (
    <>
      {user && (
        <Group
          py="md"
          w="100%"
          maw={"1200px"}
          mx="auto"
          px="xs"
          justify="center"
          gap="md"
        >
          {!runs.data?.length ? (
            <ActionIcon
              w="fit-content"
              size="xl"
              onClick={() => {
                openCreatePlan();
              }}
              radius="xl"
            >
              <IconPlus size={30} />
            </ActionIcon>
          ) : (
            <ActionIcon
              w="fit-content"
              size="xl"
              onClick={() => {
                openAddRun();
              }}
              radius="xl"
            >
              <IconPlus size={30} />
            </ActionIcon>
          )}
          <div></div>
        </Group>
      )}
      <CreatePlanModal opened={createPlanOpened} onClose={closeCreatePlan} />
      <AddRunModal opened={addRunOpened} onClose={closeAddRun} />
    </>
  );
}
