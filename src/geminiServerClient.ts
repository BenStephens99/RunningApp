import { GoogleGenAI } from "@google/genai";

enum GEMINI_MODELS {
  GEMINI_3_5_FLASH = "gemini-3.5-flash",
  GEMINI_3_1_FLASH_LITE = "gemini-3.1-flash-lite",
  GEMINI_2_5_FLASH = "gemini-2.5-flash",
}

export const CURRENT_MODEL = GEMINI_MODELS.GEMINI_3_5_FLASH;

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
