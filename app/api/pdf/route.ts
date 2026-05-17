import { embedChunks } from "@/app/lib/embedder";
import { chunkText } from "@/app/lib/chunker";
import { extractPdfText } from "@/app/lib/pdf-utils";
import { saveDocument } from "@/app/lib/vector-store";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return Response.json({ error: "File must be a PDF" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const text = await extractPdfText(buffer);
  const chunks = chunkText(text);
  const embeddedChunks = await embedChunks(chunks);

  saveDocument(file.name, embeddedChunks);

  console.log(`[pdf] "${file.name}" — ${text.length} chars, ${chunks.length} chunks`);
  console.log(`[embed] ${embeddedChunks.length} embeddings created`);
  console.log(`[embed] vector dimensions: ${embeddedChunks[0].embedding.length}`);
  console.log(
    `[embed] first chunk — index: ${embeddedChunks[0].index}, chars: ${embeddedChunks[0].text.length}, start: ${embeddedChunks[0].start}`,
  );

  return Response.json({
    filename: file.name,
    charCount: text.length,
    chunkCount: chunks.length,
    embeddingDimensions: embeddedChunks[0].embedding.length,
  });
}
