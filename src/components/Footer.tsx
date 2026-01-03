import {
  ActionIcon,
  AppShell,
  Button,
  Group,
  Menu,
  Modal,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconPencil,
  IconDotsVertical,
  IconTrash,
} from "@tabler/icons-react";
import { useRouteContext } from "@tanstack/react-router";
import { CreatePlanModal } from "./CreatePlanModal";
import { useDeleteAllRuns } from "~/hooks/runs";
import { AddRunModal } from "./AddRunModal";

import { useGetRuns } from "~/hooks/runs";

export function Footer() {
  const deleteAllRuns = useDeleteAllRuns();
  const runs = useGetRuns();

  const [createPlanOpened, { open: openCreatePlan, close: closeCreatePlan }] =
    useDisclosure(false);
  const [addRunOpened, { open: openAddRun, close: closeAddRun }] =
    useDisclosure(false);

  const [
    deleteConfirmOpened,
    { open: openDeleteConfirm, close: closeDeleteConfirm },
  ] = useDisclosure(false);

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
          justify="space-between"
          gap="md"
        >
          <Menu>
            <Menu.Target>
              <ActionIcon variant="light" bg="transparent" color="indigo.1">
                <IconDotsVertical size={24} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={20} />}
                onClick={() => {
                  openDeleteConfirm();
                }}
              >
                Delete plan
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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
      <DeletePlanModal
        opened={deleteConfirmOpened}
        onClose={closeDeleteConfirm}
        onConfirm={() =>
          deleteAllRuns.mutate(
            {},
            {
              onSuccess: () => {
                closeDeleteConfirm();
              },
            }
          )
        }
        isLoading={deleteAllRuns.isPending}
      />
    </>
  );
}

function DeletePlanModal({
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
    <Modal opened={opened} onClose={onClose} title="Delete plan">
      <Text>
        Are you sure you want to delete this plan? This action cannot be undone.
      </Text>
      <Group justify="flex-end" mt="md">
        <Button onClick={onClose} variant="default">
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
    </Modal>
  );
}
