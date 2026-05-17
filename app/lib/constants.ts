// Context usage indicator thresholds (percentage of model context window used).
// Adjust these to control when warnings appear in the UI.

/** Show the sidebar dot and amber color at this % */
export const CONTEXT_WARN_PCT = 40;

/** Show red color and "Start a new chat" nudge at this % */
export const CONTEXT_DANGER_PCT = 70;

/** Minimum cosine similarity score for retrieved chunks to be injected into the chat prompt.
 *  Below this value the LLM answers from general knowledge only. */
export const MIN_RAG_SCORE = 0.35;
