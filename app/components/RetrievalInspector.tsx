"use client";

import { useState } from "react";

export type CitationResult = {
  score: number;
  index: number;
  start: number;
  end: number;
  text: string;
  filename: string;
};

export type RetrievalSnapshot = {
  query: string;
  topK: number;
  latencyMs: number;
  results: CitationResult[];
};

export function RetrievalInspector({
  snapshot,
}: {
  snapshot: RetrievalSnapshot | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(
    new Set(),
  );

  if (!snapshot || snapshot.results.length === 0) return null;

  function toggleChunk(index: number) {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const queryPreview =
    snapshot.query.length > 60
      ? snapshot.query.slice(0, 60) + "…"
      : snapshot.query;

  return (
    <div className="my-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition"
      >
        <svg
          className={`w-3 h-3 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span className="font-semibold uppercase tracking-wide text-[10px] text-zinc-500 dark:text-zinc-400">
          Retrieval Inspector
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className="text-zinc-600 dark:text-zinc-400 italic truncate max-w-[220px]">
          &ldquo;{queryPreview}&rdquo;
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {snapshot.results.length} chunk{snapshot.results.length !== 1 ? "s" : ""}
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          top-{snapshot.topK}
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {snapshot.latencyMs}ms
        </span>
      </button>

      {/* Chunk rows — only rendered when open */}
      {isOpen && <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-t border-zinc-200 dark:border-zinc-800">
        {snapshot.results.map((chunk) => {
          const isExpanded = expandedChunks.has(chunk.index);
          const chunkLength = chunk.end - chunk.start;
          const preview =
            chunk.text.length > 200
              ? chunk.text.slice(0, 200) + "…"
              : chunk.text;

          return (
            <div key={chunk.index} className="px-4 py-3 space-y-1.5">
              {/* Chunk metadata row */}
              <div className="flex items-center gap-2 flex-wrap font-mono">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">
                  {Math.round(chunk.score * 100)}%
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">
                  #{chunk.index}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  chars {chunk.start.toLocaleString()}–{chunk.end.toLocaleString()}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {chunkLength.toLocaleString()} chars
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-[160px]">
                  {chunk.filename}
                </span>
              </div>

              {/* Preview text */}
              {!isExpanded && (
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {preview}
                </p>
              )}

              {/* Full text (expanded) */}
              {isExpanded && (
                <pre className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words font-sans bg-white dark:bg-zinc-800/60 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 overflow-x-auto">
                  {chunk.text}
                </pre>
              )}

              {/* Toggle button */}
              <button
                type="button"
                onClick={() => toggleChunk(chunk.index)}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition flex items-center gap-1"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {isExpanded ? "Hide full chunk" : "Show full chunk"}
              </button>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
