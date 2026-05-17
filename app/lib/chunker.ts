export type Chunk = {
  index: number;
  text: string;
  start: number;
  end: number;
};

export type ChunkOptions = {
  /** Number of characters per chunk. Default: 1000 */
  chunkSize?: number;
  /** Number of characters shared between consecutive chunks. Default: 200 */
  overlap?: number;
};

export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const { chunkSize = 1000, overlap = 200 } = options;
  const step = chunkSize - overlap;
  const chunks: Chunk[] = [];

  for (let i = 0; i < text.length; i += step) {
    const start = i;
    const end = Math.min(i + chunkSize, text.length);
    chunks.push({ index: chunks.length, text: text.slice(start, end), start, end });
    if (end === text.length) break;
  }

  return chunks;
}
