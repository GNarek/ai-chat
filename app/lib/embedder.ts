import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import type { Chunk } from "./chunker";

export type EmbeddedChunk = Chunk & {
  embedding: number[];
};

export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: chunks.map((c) => c.text),
  });

  return chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));
}
