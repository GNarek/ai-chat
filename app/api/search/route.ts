import { MIN_RAG_SCORE } from "@/app/lib/constants";
import { searchDocument } from "@/app/lib/retriever";

export async function POST(req: Request) {
  const { query, filename, k = 3 } = await req.json();

  if (!query || !filename) {
    return Response.json(
      { error: "query and filename are required" },
      { status: 400 },
    );
  }

  const t0 = Date.now();
  const results = await searchDocument(filename, query, k);
  const latencyMs = Date.now() - t0;

  const topScore = results[0]?.score ?? 0;
  const contextUsed = topScore >= MIN_RAG_SCORE;

  if (results.length === 0) {
    console.log(`[search] no document found for "${filename}"`);
    return Response.json({
      results: [],
      topK: k,
      latencyMs,
      threshold: MIN_RAG_SCORE,
      topScore,
      contextUsed,
    });
  }

  console.log(
    `[search] query: "${query.slice(0, 80)}" | top: ${topScore.toFixed(4)} | threshold: ${MIN_RAG_SCORE} | context: ${contextUsed ? "used" : "skipped"} | ${latencyMs}ms`,
  );
  results.forEach((r) => {
    console.log(
      `  chunk ${r.index} | score: ${r.score.toFixed(4)} | chars ${r.start}–${r.end} (${r.end - r.start} chars)`,
    );
    console.log(`  preview: ${r.text.slice(0, 100)}…`);
  });

  return Response.json({
    results,
    topK: k,
    latencyMs,
    threshold: MIN_RAG_SCORE,
    topScore,
    contextUsed,
  });
}
