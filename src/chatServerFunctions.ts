import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseServerClient } from "./utils/supabase";
import { Chat, ChatMessage } from "./types";

const CHAT_MODEL = "gemini-3.5-flash";
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_NAME_MAX_LENGTH = 60;
const RUNNING_COACH_SYSTEM_PROMPT = `
You are an expert running coach.
Your role is to give practical, safe, and encouraging advice about running.

Focus areas:
- training plans
- pacing
- recovery
- injury risk reduction
- race preparation
- motivation and consistency

Rules:
- Keep responses concise and actionable.
- If context is missing, ask one brief clarifying question before giving a full plan.
- Do not provide medical diagnosis. For pain/injury concerns, suggest consulting a qualified professional.
- Stay on topic: running, fitness, and closely related health/wellness guidance.
`.trim();
const CHAT_NAME_SYSTEM_PROMPT = `
Generate a short chat title for a running-related conversation.

Rules:
- Return only the title text.
- Keep it between 2 and 6 words.
- No quotes, no markdown, no punctuation at the end.
- Keep it specific to the user's intent.
`.trim();

async function getAuthenticatedUserId() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

export const getChats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Chat[];
});

export const createChat = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: userId,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Chat;
});

export const deleteChat = createServerFn({ method: "POST" })
  .inputValidator((d: { chatId: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const userId = await getAuthenticatedUserId();

    const { data: existingChat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", data.chatId)
      .eq("user_id", userId)
      .single();

    if (chatError || !existingChat) {
      throw new Error("Chat not found");
    }

    const { error: deleteMessagesError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("chat_id", data.chatId)
      .eq("user_id", userId);

    if (deleteMessagesError) throw deleteMessagesError;

    const { error: deleteChatError } = await supabase
      .from("chats")
      .delete()
      .eq("id", data.chatId)
      .eq("user_id", userId);

    if (deleteChatError) throw deleteChatError;

    return { id: data.chatId };
  });

export const getChatMessages = createServerFn({ method: "GET" })
  .inputValidator((d: { chatId: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const userId = await getAuthenticatedUserId();

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", data.chatId)
      .eq("user_id", userId)
      .single();

    if (chatError || !chat) {
      throw new Error("Chat not found");
    }

    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", data.chatId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (rows ?? []) as ChatMessage[];
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { chatId?: string; message: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const userId = await getAuthenticatedUserId();
    const trimmedMessage = data.message.trim();

    if (!trimmedMessage) {
      throw new Error("Message is required");
    }

    let chatId = data.chatId;
    let canGenerateChatName = false;
    if (chatId) {
      const { data: existingChat, error: chatError } = await supabase
        .from("chats")
        .select("id,name")
        .eq("id", chatId)
        .eq("user_id", userId)
        .single();

      if (chatError || !existingChat) {
        throw new Error("Chat not found");
      }
      canGenerateChatName = !existingChat.name;
    } else {
      const { data: newChat, error: createChatError } = await supabase
        .from("chats")
        .insert({
          user_id: userId,
          status: "active",
        })
        .select("*")
        .single();

      if (createChatError || !newChat) {
        throw createChatError ?? new Error("Failed to create chat");
      }
      chatId = newChat.id;
      canGenerateChatName = true;
    }

    const { data: userMessage, error: userMessageError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        user_id: userId,
        message: trimmedMessage,
        role: "user",
        status: "completed",
        model: "user",
      })
      .select("*")
      .single();

    if (userMessageError || !userMessage) {
      throw userMessageError ?? new Error("Failed to save message");
    }

    const { data: existingMessages, error: historyError } = await supabase
      .from("chat_messages")
      .select("role,message")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (historyError) throw historyError;

    const conversationHistory = (existingMessages ?? [])
      .map((message) => `${message.role}: ${message.message}`)
      .join("\n");
    const isFirstExchange = (existingMessages ?? []).length === 1;

    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        user_id: userId,
        message: "",
        role: "generated",
        status: "generating",
        model: CHAT_MODEL,
      })
      .select("*")
      .single();

    if (assistantMessageError || !assistantMessage) {
      throw assistantMessageError ?? new Error("Failed to create response row");
    }

    let generatedText = "";
    try {
      const response = await gemini.models.generateContent({
        model: CHAT_MODEL,
        contents: `${RUNNING_COACH_SYSTEM_PROMPT}\n\nConversation:\n${conversationHistory}`,
      });
      generatedText = response.text?.trim() ?? "";
    } catch (error) {
      await supabase
        .from("chat_messages")
        .update({
          status: "error",
          message: "Something went wrong generating a response.",
        })
        .eq("id", assistantMessage.id);

      throw error;
    }

    const { data: updatedAssistantMessage, error: updateAssistantError } = await supabase
      .from("chat_messages")
      .update({
        message: generatedText || "I could not generate a response.",
        status: "completed",
      })
      .eq("id", assistantMessage.id)
      .select("*")
      .single();

    if (updateAssistantError || !updatedAssistantMessage) {
      throw updateAssistantError ?? new Error("Failed to save response");
    }

    let generatedChatName: string | null = null;
    if (canGenerateChatName && isFirstExchange) {
      try {
        const titleResponse = await gemini.models.generateContent({
          model: CHAT_MODEL,
          contents: `${CHAT_NAME_SYSTEM_PROMPT}

First user message:
${trimmedMessage}

First assistant response:
${generatedText}`,
        });

        const rawTitle = titleResponse.text ?? "";
        const normalizedTitle = rawTitle
          .replace(/[\r\n]+/g, " ")
          .replace(/["`*_#]/g, "")
          .trim();

        if (normalizedTitle) {
          generatedChatName = normalizedTitle.slice(0, CHAT_NAME_MAX_LENGTH);
        }
      } catch (_error) {
        // Title generation should never block the main chat response path.
      }
    }

    const { error: updateChatError } = await supabase
      .from("chats")
      .update({
        updated_at: new Date().toISOString(),
        status: "active",
        ...(generatedChatName ? { name: generatedChatName } : {}),
      })
      .eq("id", chatId);

    if (updateChatError) throw updateChatError;

    return {
      chatId: chatId as string,
      userMessage: userMessage as ChatMessage,
      assistantMessage: updatedAssistantMessage as ChatMessage,
    };
  });
