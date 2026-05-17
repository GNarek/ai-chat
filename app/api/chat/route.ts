import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { z } from "zod";

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

const calculator = tool({
  description:
    "Evaluate a math expression (e.g. '2 + 2', '(3 * 4) / 2', 'Math.sqrt(144)')",
  inputSchema: z.object({
    expression: z.string().describe("The math expression to evaluate"),
  }),
  execute: async ({ expression }: { expression: string }) => {
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return { expression, result: String(result) };
    } catch {
      return { expression, result: "Error: invalid expression" };
    }
  },
});

const getRandomJoke = tool({
  description: "Returns a random programming joke",
  inputSchema: z.object({}), // no inputs needed
  execute: async () => {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs.",
      "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
      "Why do Java developers wear glasses? Because they don't C#.",
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return { joke };
  },
});

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model?: string } =
    await req.json();

  const result = streamText({
    model: getAllowedModel(model),
    system:
      "You are an AI coding mentor. Explain code clearly and practically, using TypeScript examples when helpful. Teach the reasoning behind recommendations, call out tradeoffs when they matter, and keep answers focused on the user's goal. Ask clarifying questions only when the request is ambiguous or missing information needed to give a correct answer.",
    messages: await convertToModelMessages(messages),
    tools: { calculator, getRandomJoke },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
