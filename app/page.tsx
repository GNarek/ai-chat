"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import {
  MODEL_CONTEXT_LIMIT,
  type ChatSession,
  type ModelId,
  deleteSession,
  deriveTitle,
  estimateTokens,
  loadMessages,
  loadSessions,
  saveMessages,
  saveSession,
} from "./lib/chat-store";
import { CONTEXT_DANGER_PCT, CONTEXT_WARN_PCT } from "./lib/constants";

const MODEL_OPTIONS: { id: ModelId; label: string }[] = [
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 nano" },
  { id: "gpt-4o", label: "GPT-4o" },
];

function buildNewChatSession(model: ModelId): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    createdAt: Date.now(),
    model,
  };
}

export default function ChatPage() {
  // Start with identical empty state on server and client to avoid hydration mismatch.
  // localStorage is read in a useEffect after mount.
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [initialMessages, setInitialMessages] = useState<
    ReturnType<typeof loadMessages>
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelId>("gpt-4o-mini");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = loadSessions();
    let chatId: string;
    if (stored.length > 0 && stored[0].title === "New Chat") {
      chatId = stored[0].id;
    } else {
      const session = buildNewChatSession("gpt-4o-mini");
      saveSession(session);
      stored.unshift(session);
      chatId = session.id;
    }
    setSessions(stored);
    setActiveChatId(chatId);
  }, []);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: activeChatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: ({ messages: finishedMessages }) => {
      saveMessages(activeChatId, finishedMessages);
      const existing = loadSessions().find((s) => s.id === activeChatId);
      const updated: ChatSession = {
        id: activeChatId,
        title: deriveTitle(finishedMessages),
        createdAt: existing?.createdAt ?? 0,
        model: selectedModel,
      };
      saveSession(updated);
      setSessions(loadSessions());
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const selectedModelLabel =
    MODEL_OPTIONS.find((m) => m.id === selectedModel)?.label ?? "GPT-4o mini";

  const contextPct = Math.min(
    100,
    (estimateTokens(messages) / MODEL_CONTEXT_LIMIT) * 100
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startNewChat() {
    // If the active chat is already a blank "New Chat" with no messages, just stay
    const currentSession = sessions.find((s) => s.id === activeChatId);
    if (currentSession?.title === "New Chat" && messages.length === 0) {
      inputRef.current?.focus();
      return;
    }
    const session = buildNewChatSession(selectedModel);
    saveSession(session);
    setSessions(loadSessions());
    setActiveChatId(session.id);
    setInitialMessages([]);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  function switchToChat(id: string) {
    const stored = loadMessages(id);
    const session = sessions.find((s) => s.id === id);
    setActiveChatId(id);
    setInitialMessages(stored);
    setMessages(stored);
    if (session) setSelectedModel(session.model);
    setInput("");
    inputRef.current?.focus();
  }

  function handleDeleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteSession(id);
    const updated = loadSessions();
    setSessions(updated);
    if (activeChatId === id) startNewChat();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input }, { body: { model: selectedModel } });
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Chats
          </span>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {/* Fixed "New Chat" item — always at the top */}
          <button
            onClick={startNewChat}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition border-l-2 border-dashed ${
              sessions.find((s) => s.id === activeChatId)?.title === "New Chat"
                ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-600 dark:hover:text-zinc-400"
            }`}
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="flex-1 truncate italic">New Chat</span>
          </button>

          {/* Chat history items */}
          {sessions
            .filter((s) => s.title !== "New Chat")
            .map((session) => (
              <button
                key={session.id}
                onClick={() => switchToChat(session.id)}
                className={`group w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition ${
                  activeChatId === session.id
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <span className="flex-1 truncate">{session.title}</span>
                {activeChatId === session.id && contextPct >= CONTEXT_WARN_PCT && (
                  <span
                    className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                      contextPct >= CONTEXT_DANGER_PCT
                        ? "bg-red-500"
                        : "bg-amber-400"
                    }`}
                    title={`${Math.round(contextPct)}% of context used`}
                  />
                )}
                <span
                  role="button"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition"
                  aria-label="Delete chat"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              </button>
            ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-500 dark:text-zinc-400"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-white dark:text-zinc-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {sessions.find((s) => s.id === activeChatId)?.title ??
                "AI Assistant"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Powered by {selectedModelLabel}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelId)}
              disabled={isLoading}
              className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 outline-none transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                isLoading
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLoading ? "bg-amber-500 animate-pulse" : "bg-green-500"
                }`}
              />
              {isLoading ? "Thinking…" : "Ready"}
            </span>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
                <p className="text-lg font-medium mb-1">
                  How can I help you today?
                </p>
                <p className="text-sm">Send a message to start chatting.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 mt-1 shrink-0 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-white dark:text-zinc-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm"
                      : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </span>
                    ) : part.type === "tool-calculator" ? (
                      <div
                        key={i}
                        className="my-1 flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs font-mono"
                      >
                        <span className="text-zinc-400 dark:text-zinc-500 shrink-0">
                          ƒ
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {part.state === "input-streaming"
                            ? "…"
                            : String((part.input as { expression: string }).expression)}
                        </span>
                        {part.state === "output-available" && (
                          <>
                            <span className="text-zinc-400 dark:text-zinc-500">=</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {String((part.output as { result: string }).result)}
                            </span>
                          </>
                        )}
                      </div>
                    ) : null
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-7 h-7 mt-1 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {status === "submitted" && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 mt-1 shrink-0 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-white dark:text-zinc-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Context usage bar — shown whenever there are messages */}
        {messages.length > 0 && (
          <div className="shrink-0 px-4 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      contextPct >= CONTEXT_DANGER_PCT
                        ? "bg-red-500"
                        : contextPct >= CONTEXT_WARN_PCT
                          ? "bg-amber-400"
                          : "bg-zinc-400 dark:bg-zinc-500"
                    }`}
                    style={{ width: `${Math.max(contextPct, 1)}%` }}
                  />
                </div>
                <span
                  className={`text-xs shrink-0 ${
                    contextPct >= CONTEXT_DANGER_PCT
                      ? "text-red-500"
                      : contextPct >= CONTEXT_WARN_PCT
                        ? "text-amber-500"
                        : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {contextPct >= CONTEXT_DANGER_PCT
                    ? `${Math.round(contextPct)}% · Start a new chat`
                    : `${Math.round(contextPct)}% of context used`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shrink-0">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Message AI Assistant…"
                className="flex-1 min-h-[44px] resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent disabled:opacity-50 transition"
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="h-[44px] px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send
                </button>
              )}
            </form>
            <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
