import {
  ActionIcon,
  Button,
  Card,
  Group,
  Menu,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconDotsVertical, IconPlus, IconTrash } from "@tabler/icons-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCreateChat, useDeleteChat, useGetChats } from "~/hooks/chats";

export const Route = createFileRoute("/_authed/chats/")({
  component: Chats,
});

function Chats() {
  const navigate = useNavigate();
  const chats = useGetChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();

  const handleCreateChat = async () => {
    const newChat = await createChat.mutateAsync({ data: undefined });
    navigate({ to: `/chats/${newChat.id}` });
  };

  return (
    <Stack gap="md">
      <Title order={3}>Chats</Title>
      <Button
        onClick={() => void handleCreateChat()}
        loading={createChat.isPending}
        leftSection={<IconPlus size={16} />}
        radius="xl"
        size="md"
        variant="light"
      >
        Create chat
      </Button>

      <Stack gap="xs">
        {chats.data?.length ? (
          chats.data.map((chat, index) => (
            <Card key={chat.id} withBorder radius="md" padding="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Link
                  to="/chats/$chatId"
                  params={{ chatId: chat.id }}
                  style={{ textDecoration: "none", flex: 1 }}
                >
                  <Stack gap={2}>
                    <Text fw={600}>{chat.name || `Chat ${chats.data.length - index}`}</Text>
                    <Text size="xs" c="dimmed">
                      Updated {new Date(chat.updated_at).toLocaleString()}
                    </Text>
                  </Stack>
                </Link>

                <Menu shadow="md" position="bottom-end" withArrow>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label="Chat actions"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        deleteChat.mutate({ data: { chatId: chat.id } });
                      }}
                    >
                      Delete chat
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Card>
          ))
        ) : (
          <Text c="dimmed" size="sm">
            No chats yet. Create one to start.
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
