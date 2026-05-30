import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import {
  createChat,
  deleteChat,
  getChatMessages,
  getChats,
  getOrCreateRunChat,
  sendChatMessage,
} from "~/chatServerFunctions";
import { useInvalidateMutation } from "./useInvalidateMutation";

export function useGetChats() {
  return useQuery({
    queryKey: QueryCacheKeys.chats(),
    queryFn: useServerFn(getChats),
  });
}

export function useCreateChat() {
  return useInvalidateMutation({
    mutationFn: useServerFn(createChat),
    queryKey: QueryCacheKeys.chats(),
  });
}

export function useDeleteChat() {
  return useInvalidateMutation({
    mutationFn: useServerFn(deleteChat),
    queryKey: QueryCacheKeys.chats(),
  });
}

export function useGetOrCreateRunChat(planId: string) {
  return useInvalidateMutation({
    mutationFn: useServerFn(getOrCreateRunChat),
    queryKeys: [QueryCacheKeys.chats(), QueryCacheKeys.runPlan(planId)],
  });
}

export function useGetChatMessages(chatId?: string) {
  const getChatMessagesFn = useServerFn(getChatMessages);
  return useQuery({
    queryKey: QueryCacheKeys.chatMessages(chatId ?? ""),
    queryFn: () => getChatMessagesFn({ data: { chatId: chatId ?? "" } }),
    enabled: !!chatId,
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: useServerFn(sendChatMessage),
  });
}
