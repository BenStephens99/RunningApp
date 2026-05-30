import {
  ActionIcon,
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconArrowLeft, IconArrowUp } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Streamdown, type Components } from "streamdown";
import "streamdown/styles.css";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { useGetChatMessages, useSendChatMessage } from "~/hooks/chats";

const STREAM_DELAY_MS = 10;

const chatMarkdownComponents: Components = {
  p: ({ children }) => (
    <Text size="sm" mb="xs" style={{ lineHeight: 1.5 }}>
      {children}
    </Text>
  ),
  ul: ({ children }) => (
    <ul style={{ marginTop: 0, marginBottom: 8, paddingLeft: 18 }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ marginTop: 0, marginBottom: 8, paddingLeft: 18 }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li>
      <Text size="sm" component="span" style={{ lineHeight: 1.5 }}>
        {children}
      </Text>
    </li>
  ),
  inlineCode: ({ children }) => (
    <Text
      component="code"
      size="sm"
      style={{
        background: "var(--mantine-color-dark-6)",
        padding: "2px 6px",
        borderRadius: 6,
      }}
    >
      {children}
    </Text>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = "data-block" in props;

    if (!isBlock) {
      return (
        <Text
          component="code"
          size="sm"
          style={{
            background: "var(--mantine-color-dark-6)",
            padding: "2px 6px",
            borderRadius: 6,
          }}
        >
          {children}
        </Text>
      );
    }

    return (
      <Paper
        component="pre"
        withBorder
        radius="sm"
        p="xs"
        my="xs"
        style={{
          background: "var(--mantine-color-dark-8)",
          borderColor: "var(--mantine-color-dark-5)",
          overflowX: "auto",
        }}
      >
        <code
          className={className}
          style={{
            display: "block",
            fontFamily: "var(--mantine-font-family-monospace)",
            fontSize: "var(--mantine-font-size-xs)",
            lineHeight: 1.55,
            whiteSpace: "pre",
          }}
        >
          {children}
        </code>
      </Paper>
    );
  },
};

export const Route = createFileRoute("/_authed/chats/$chatId")({
  component: ChatDetailPage,
});

function ChatDetailPage() {
  const { chatId } = Route.useParams();
  const queryClient = useQueryClient();
  const messages = useGetChatMessages(chatId);
  const sendChatMessage = useSendChatMessage();

  const [draftMessage, setDraftMessage] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [streamedAssistantMessage, setStreamedAssistantMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const chatMessagesToDisplay = useMemo(() => {
    const storedMessages = (messages.data ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      message: message.message,
    }));

    if (pendingUserMessage) {
      storedMessages.push({
        id: "pending-user",
        role: "user",
        message: pendingUserMessage,
      });
    }

    if (streamedAssistantMessage !== null) {
      storedMessages.push({
        id: "streaming-generated",
        role: "generated",
        message: streamedAssistantMessage,
      });
    }

    return storedMessages;
  }, [messages.data, pendingUserMessage, streamedAssistantMessage]);

  const handleSendMessage = async () => {
    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage || isStreaming || sendChatMessage.isPending) {
      return;
    }

    setDraftMessage("");
    setPendingUserMessage(trimmedMessage);
    setStreamedAssistantMessage("");
    setIsStreaming(true);

    try {
      const response = await sendChatMessage.mutateAsync({
        data: {
          chatId,
          message: trimmedMessage,
        },
      });

      const generatedText = response.assistantMessage.message ?? "";
      for (let index = 1; index <= generatedText.length; index += 1) {
        setStreamedAssistantMessage(generatedText.slice(0, index));
        await new Promise((resolve) => setTimeout(resolve, STREAM_DELAY_MS));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QueryCacheKeys.chats() }),
        queryClient.invalidateQueries({
          queryKey: QueryCacheKeys.chatMessages(chatId),
        }),
      ]);
    } finally {
      setPendingUserMessage(null);
      setStreamedAssistantMessage(null);
      setIsStreaming(false);
    }
  };

  return (
    <Stack
      h="calc(100dvh - 170px)"
      style={{ position: "relative" }}
      gap="sm"
      py="xs"
    >
      <ActionIcon
        component={Link}
        to="/chats"
        variant="subtle"
        size="lg"
        aria-label="Back to chats"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}
      >
        <IconArrowLeft size={20} />
      </ActionIcon>

      <ScrollArea h="100%" offsetScrollbars px={4}>
        <Stack gap="xs" pb={100}>
          {chatMessagesToDisplay.length ? (
            chatMessagesToDisplay.map((message) => {
              const isStreamingMessage =
                message.id === "streaming-generated" && isStreaming;

              return (
                <Card
                  key={message.id}
                  radius="lg"
                  p="sm"
                  maw={message.role === "user" ? "85%" : "100%"}
                  ml={message.role === "user" ? "auto" : 0}
                  bg={
                    message.role === "user"
                      ? "var(--mantine-color-indigo-9)"
                      : "transparent"
                  }
                >
                  <Streamdown
                    animated
                    caret="block"
                    components={chatMarkdownComponents}
                    isAnimating={isStreamingMessage}
                    mode={isStreamingMessage ? "streaming" : "static"}
                  >
                    {isStreamingMessage ? message.message : message.message || "..."}
                  </Streamdown>
                </Card>
              );
            })
          ) : (
            <Text c="dimmed" size="sm" ta="center" mt="md">
              Send your first message.
            </Text>
          )}
        </Stack>
      </ScrollArea>

      <Paper
        withBorder
        radius="xl"
        p="xs"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderColor: "var(--mantine-color-dark-4)",
          background: "var(--mantine-primary-color-8)",
        }}
      >
        <Group align="flex-end" gap="xs" wrap="nowrap">
          <Textarea
            placeholder="Message..."
            autosize
            minRows={1}
            maxRows={6}
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSendMessage();
              }
            }}
            disabled={isStreaming || sendChatMessage.isPending}
            variant="unstyled"
            style={{ flex: 1 }}
            styles={{
              input: {
                color: "var(--mantine-color-gray-1)",
              },
            }}
          />
          <Button
            onClick={() => void handleSendMessage()}
            loading={sendChatMessage.isPending || isStreaming}
            disabled={!draftMessage.trim()}
            radius="xl"
            px={10}
          >
            <IconArrowUp size={16} />
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
