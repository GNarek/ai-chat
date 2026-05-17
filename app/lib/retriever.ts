import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import type { EmbeddedChunk } from "./embedder";
import { getDocument } from "./vector-store";

export type RetrievalResult = {
  score: number;
  index: number;
  start: number;
  end: number;
  text: string;
  filename: string;
};

// OpenAI's text-embedding-3-small outputs normalized vectors,
// so dot product == cosine similarity (magnitude is always 1).
export function cosineSimilarity(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

export async function searchDocument(
  filename: string,
  query: string,
  k = 3,
): Promise<RetrievalResult[]> {
  const doc = getDocument(filename);
  if (!doc) return [];

  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  return doc.chunks
    .map((chunk: EmbeddedChunk) => ({
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
      index: chunk.index,
      start: chunk.start,
      end: chunk.end,
      text: chunk.text,
      filename,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
