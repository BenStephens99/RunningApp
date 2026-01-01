import { ActionIcon, AppShell, Button, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconPencil } from "@tabler/icons-react";
import { useRouteContext } from "@tanstack/react-router";
import { CreatePlanModal } from "./CreatePlanModal";
import { useEditing } from "~/contexts/EditingContext";

export function Footer() {
  const [opened, { open, close }] = useDisclosure(false);
  const { isEditing, toggleEditing } = useEditing();
  const { user } = useRouteContext({ from: "__root__" });

  return (
    <>
      <AppShell.Footer py="xs">
        {user && (
          <Group
            w="100%"
            maw={"1200px"}
            mx="auto"
            px="xs"
            justify="center"
            gap="md"
          >
            <ActionIcon
              variant={isEditing ? "filled" : "light"}
              size="lg"
              onClick={toggleEditing}
              radius="xl"
            >
              <IconPencil size={24} />
            </ActionIcon>
            <ActionIcon
              w="fit-content"
              size="lg"
              onClick={() => {
                open();
              }}
              radius="xl"
            >
              <IconPlus size={24} />
            </ActionIcon>
          </Group>
        )}
      </AppShell.Footer>
      <CreatePlanModal opened={opened} onClose={close} addMode={true} />
    </>
  );
}
