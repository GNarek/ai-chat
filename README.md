# AI Chat

A streaming AI chat app built with Next.js, TypeScript, and OpenAI. Designed as a learning project to explore how modern AI chat interfaces actually work under the hood.

## Features

**Streaming responses** — replies appear word by word in real time, just like ChatGPT. You can stop a response mid-stream if the model goes off track.

**Model selection** — switch between three OpenAI models from the header. Each chat session remembers which model you used.

| Model | Best for |
|---|---|
| GPT-4o mini | Fast, cheap, everyday questions |
| GPT-4.1 nano | Lightest and fastest |
| GPT-4o | Best quality, higher cost |

**Chat history** — all your conversations are saved locally in the browser. Switch between past chats from the sidebar, pick up where you left off, or delete ones you no longer need.

**Context usage indicator** — a progress bar above the input box shows how much of the model's context window you've used. Helps you know when it's worth starting a fresh chat to keep costs down.

**Built-in tools** — the assistant can call tools mid-response when needed:
- **Calculator** — evaluates math expressions precisely instead of guessing
- **Random joke** — returns a programming joke (great for testing tool calling)

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Project Structure

```
app/
  api/chat/route.ts   — server-side: model config, system prompt, tools
  lib/chat-store.ts   — localStorage helpers for sessions and messages
  lib/constants.ts    — tunable config (context warning thresholds)
  page.tsx            — the full chat UI
```

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai) v6
- [OpenAI](https://platform.openai.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod](https://zod.dev) for tool input validation
