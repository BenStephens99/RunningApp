import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendGeminiMessage, sendGeminiRunPlan } from "~/geminiServerFunctions";

export function useGeminiMessage() {
  return useMutation({
    mutationFn: useServerFn(sendGeminiMessage),
  });
}

export function useCreateGeminiRunPlan() {
  return useMutation({
    mutationFn: useServerFn(sendGeminiRunPlan),
  });
}
