import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { z } from "zod";
import { searchDocument } from "@/app/lib/retriever";

export const maxDuration = 30;

const DEFAULT_MODEL = "gpt-4o-mini";
const ALLOWED_MODELS = {
  "gpt-4o-mini": openai("gpt-4o-mini"),
  "gpt-4.1-nano": openai("gpt-4.1-nano"),
  "gpt-4o": openai("gpt-4o"),
} as const;

const BASE_SYSTEM =
  "You are an AI coding mentor. Explain code clearly and practically, using TypeScript examples when helpful. Teach the reasoning behind recommendations, call out tradeoffs when they matter, and keep answers focused on the user's goal. Ask clarifying questions only when the request is ambiguous or missing information needed to give a correct answer.";

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
  const {
    messages,
    model,
    filename,
  }: { messages: UIMessage[]; model?: string; filename?: string } =
    await req.json();

  let contextBlock = "";

  if (filename) {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    const queryText =
      lastUserMessage?.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join(" ") ?? "";

    if (queryText) {
      const results = await searchDocument(filename, queryText);

      if (results.length > 0) {
        console.log(`[rag] query: "${queryText.slice(0, 80)}"`);
        results.forEach((r) =>
          console.log(`  chunk ${r.index} | score: ${r.score.toFixed(4)}`),
        );

        contextBlock = results
          .map((r, i) => `[Chunk ${i + 1}]\n${r.text}`)
          .join("\n\n---\n\n");
      }
    }
  }

  const system = contextBlock
    ? `${BASE_SYSTEM}\n\nWhen answering, use the following excerpts from the uploaded document when they are relevant. If the context does not cover the question, answer from your own knowledge.\n\nDOCUMENT CONTEXT:\n${contextBlock}`
    : BASE_SYSTEM;

  const result = streamText({
    model: getAllowedModel(model),
    system,
    messages: await convertToModelMessages(messages),
    tools: { calculator, getRandomJoke },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
