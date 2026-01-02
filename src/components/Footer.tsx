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
            size="xl"
            onClick={toggleEditing}
            radius="xl"
            bg={isEditing ? "indigo.9" : "indigo.0"}
            color={isEditing ? "indigo.1" : "indigo.9"}
          >
            <IconPencil size={30} />
          </ActionIcon>
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
      <CreatePlanModal opened={opened} onClose={close} addMode={true} />
    </>
  );
}
