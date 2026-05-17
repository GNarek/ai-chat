import type { UIMessage } from "ai";

export type ModelId = "gpt-4o-mini" | "gpt-4.1-nano" | "gpt-4o";

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  model: ModelId;
};

const SESSIONS_KEY = "chat-sessions";

function messagesKey(id: string) {
  return `chat-messages-${id}`;
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

export function saveSession(session: ChatSession): void {
  const sessions = loadSessions().filter((s) => s.id !== session.id);
  sessions.unshift(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  localStorage.removeItem(messagesKey(id));
}

export function loadMessages(id: string): UIMessage[] {
  try {
    const raw = localStorage.getItem(messagesKey(id));
    if (!raw) return [];
    return JSON.parse(raw) as UIMessage[];
  } catch {
    return [];
  }
}

export function saveMessages(id: string, messages: UIMessage[]): void {
  localStorage.setItem(messagesKey(id), JSON.stringify(messages));
}

export function deriveTitle(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";

  const text = first.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join(" ")
    .trim();

  if (!text) return "New Chat";
  if (text.length <= 50) return text;

  const truncated = text.slice(0, 50);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "…";
}
