import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";

export const maxDuration = 30;

const DEFAULT_MODEL = "gpt-4o-mini";
const ALLOWED_MODELS = {
  "gpt-4o-mini": openai("gpt-4o-mini"),
  "gpt-4.1-nano": openai("gpt-4.1-nano"),
  "gpt-4o": openai("gpt-4o"),
} as const;

function getAllowedModel(modelId: unknown) {
  if (typeof modelId === "string" && modelId in ALLOWED_MODELS) {
    return ALLOWED_MODELS[modelId as keyof typeof ALLOWED_MODELS];
  }

  return ALLOWED_MODELS[DEFAULT_MODEL];
}

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model?: string } =
    await req.json();

  const result = streamText({
    model: getAllowedModel(model),
    system:
      "You are an AI coding mentor. Explain code clearly and practically, using TypeScript examples when helpful. Teach the reasoning behind recommendations, call out tradeoffs when they matter, and keep answers focused on the user's goal. Ask clarifying questions only when the request is ambiguous or missing information needed to give a correct answer.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
