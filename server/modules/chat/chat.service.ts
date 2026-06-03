import { config } from "../../config/env";
import { badRequest } from "../../shared/http-error";

const SYSTEM_INSTRUCTION =
  "You are Logigpt, a highly expert transport chatbot inside FlyAsh Logistics Pro. " +
  "Help user draft policy messages, answer driver wage questions, explain diesel margins, " +
  "analyze insurance policies, and optimize route delivery formats. Answer in conversational " +
  "markdown format. Use bold headers, clean lists, and numeric metrics.";

const FALLBACK_REPLY =
  "No **GEMINI_API_KEY** environment variable detected on the server.\n\n" +
  "But as a highly intelligent simulated fallback, I can still draft and analyze transport " +
  "operations! Ask me about fuel costs, insurance tracking, or documents like driver permits.";

export interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Generates an assistant reply for a chat transcript. Falls back to a canned
 * message when no Gemini API key is configured so the feature degrades gracefully.
 */
export async function generateChatReply(messages: unknown): Promise<string> {
  if (!Array.isArray(messages)) {
    throw badRequest("Messages array is required.");
  }

  if (!config.gemini.apiKey) {
    return FALLBACK_REPLY;
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({
    apiKey: config.gemini.apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  const contents = (messages as ChatMessage[]).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const response = await ai.models.generateContent({
    model: config.gemini.model,
    contents,
    config: { systemInstruction: SYSTEM_INSTRUCTION },
  });

  return response.text ?? "";
}
