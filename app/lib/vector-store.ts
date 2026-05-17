import type { EmbeddedChunk } from "./embedder";

export type StoredDocument = {
  filename: string;
  chunks: EmbeddedChunk[];
  embeddedAt: number;
};

// Module-level — persists across requests, reset on server restart
const store = new Map<string, StoredDocument>();

export function saveDocument(filename: string, chunks: EmbeddedChunk[]): void {
  store.set(filename, { filename, chunks, embeddedAt: Date.now() });
}

export function getDocument(filename: string): StoredDocument | undefined {
  return store.get(filename);
}

export function listDocuments(): string[] {
  return Array.from(store.keys());
}
