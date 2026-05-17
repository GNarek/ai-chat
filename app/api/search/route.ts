import { searchDocument } from "@/app/lib/retriever";

export async function POST(req: Request) {
  const { query, filename, k = 3 } = await req.json();

  if (!query || !filename) {
    return Response.json(
      { error: "query and filename are required" },
      { status: 400 },
    );
  }

  const results = await searchDocument(filename, query, k);

  if (results.length === 0) {
    console.log(`[search] no document found for "${filename}"`);
    return Response.json({ results: [] });
  }

  console.log(`[search] query: "${query}"`);
  console.log(`[search] top ${results.length} results:`);
  results.forEach((r) => {
    console.log(
      `  chunk ${r.index} | score: ${r.score.toFixed(4)} | chars ${r.start}–${r.end}`,
    );
    console.log(`  preview: ${r.text.slice(0, 100)}…`);
  });

  return Response.json({ results });
}
