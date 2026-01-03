import { ActionIcon, AppShell, Button, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil } from "@tabler/icons-react";
import { useRouteContext } from "@tanstack/react-router";
import { CreatePlanModal } from "./CreatePlanModal";

export function Footer() {
  const [opened, { open, close }] = useDisclosure(false);
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
          <ActionIcon
            w="fit-content"
            size="xl"
            onClick={() => {
              open();
            }}
            radius="xl"
          >
            <IconPlus size={30} />
          </ActionIcon>
        </Group>
      )}
      <CreatePlanModal opened={opened} onClose={close} />
    </>
  );
}
