# ZenixMind

ZenixMind is an AI workspace for authenticated conversations, model selection, image generation, and a personal chat/library experience. The interface and product identity are ZenixMind; GroqCloud and Pollinations are server-side providers.

## Features

- Authenticated chat and conversation history backed by Supabase.
- Zenix model catalogue with free-tier model routing.
- Groq-powered chat responses and streaming endpoints.
- Tavily-powered quick web search and multi-step deep research with citations persisted in chat history.
- Authenticated image generation through Pollinations, triggered with `/image`, `/imagine`, `/draw`, or `/create-image` in chat (natural-language image requests are also supported).
- Shareable conversation links and owner-only provider diagnostics.
- Responsive dark interface and an offline fallback page.
- Production-only service-worker registration. The worker caches only the public offline page; it does not cache API responses or private user content.

## Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS 4
- Supabase Auth and database client
- GroqCloud chat API
- Pollinations image API
- Express development server and Vercel serverless API routes

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended)
- npm
- A Supabase project
- A Groq API key for chat
- A Tavily API key for quick web search and deep research
- A Pollinations API key for image generation

## Local setup

1. Clone the repository and enter the project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

4. Set the environment variables in `.env`:

   | Variable | Purpose |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Supabase project URL used by the server-side auth checks |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; safe for browser use |
   | `GROQ_API_KEY` | Server-side Groq key for normal chat and streaming |
   | `TAVILY_API_KEY` | Server-side Tavily key for quick search and deep research |
   | `POLLINATIONS_API_KEY` | Server-side Pollinations key for image generation |

   Never expose provider secrets in browser code or commit a real `.env` file.

5. Start the local Express development server:

   ```bash
   npm run dev
   ```

   The server listens on port `3000` by default. Set `PORT` to change it.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express development server |
| `npm test` | Run the Node.js test suite through `tsx` |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run build` | Run tests, then create the Vite production build |
| `npm run preview` | Preview the generated Vite build |
| `npm start` | Start the Express server |

The production build command deliberately runs tests before Vite builds the frontend.

## Vercel deployment

The repository is configured for a Vite frontend with serverless API handlers under `/api`.

1. Import the GitHub repository into Vercel.
2. Use the repository root as the project root.
3. Set the production environment variables listed above in **Project Settings → Environment Variables**.
4. Use `npm install` as the install command and `npm run build` as the build command.
5. Set the output directory to `dist` (or allow Vercel to detect the Vite default).
6. Deploy to production after the build and tests pass.

Do not add provider secrets with a `VITE_` prefix. Vite variables are exposed to the client bundle.

## Chat commands

The chat composer supports a command palette. Type `/` to discover commands, use the arrow keys to navigate, and press Tab or tap a suggestion to insert it. The existing composer layout and free-form chat behavior remain unchanged.

| Command | Behavior |
| --- | --- |
| `/image`, `/imagine`, `/draw`, `/create-image` | Generate an image through the authenticated server endpoint and save it to the user's private Library |
| `/search` | Quick Tavily search, grounded Groq answer, and source citations |
| `/research`, `/deep-research` | Tavily multi-step research report, streamed with source citations |
| `/summarize` | Summarize supplied text or a topic |
| `/write` | Draft requested written content |
| `/translate` | Translate text while preserving meaning and tone |
| `/explain` | Explain a topic step by step |
| `/code` | Help write, review, or debug code |
| `/analyze` | Analyze text or information supplied in chat |
| `/build` | Plan and produce code for an app, website, or software feature |
| `/help` | Display the command list |

Commands other than image generation use the selected ZenixMind chat model unless they are provider-native research actions. Command-specific instructions are selected from a server-side allowlist, so chat history retains the user's original command instead of storing hidden prompt text. `/search` uses Tavily's basic Search API and grounds the selected ZenixMind model with ranked sources. `/research` uses Tavily's streaming Research API (model auto, numbered citations) to create a multi-step report. Both routes require `TAVILY_API_KEY` on the server. Tavily source links are also appended to saved assistant messages so citations remain available after reloading chat history. `/build` provides architecture and code assistance but does not claim to deploy projects or modify external systems. Image generation remains authenticated through `POST /api/generate-image`; Pollinations credentials stay server-side, and generated images are saved to the signed-in user's private Supabase Library. Natural-language image requests remain supported. Puter frontend generation is intentionally not used because it would add a separate browser identity/provider flow.


- `GET /api/health` — basic service health response.
- `GET /api/models` — authenticated model catalogue.
- `/api/chat` — authenticated conversation history, export, delete, and chat completion.
- `/api/chat/stream` — authenticated streaming chat, Tavily quick search, and Tavily deep research.
- `/api/chat/share` — conversation sharing endpoint.
- `POST /api/generate-image` — authenticated image generation.
- `/api/admin/providers` — owner-only provider configuration status.
- `POST /api/admin/providers/groq/ping` — owner-only Groq connectivity check.

All provider credentials must remain server-side. Authenticated endpoints require a valid Supabase access token.

## Offline behavior

In production, the app registers `/sw.js`. The service worker uses a network-first navigation strategy and falls back to `/offline.html` when the network is unavailable. It excludes API routes and does not cache authenticated responses, generated media, or private library data.

## Security notes

- Keep `GROQ_API_KEY`, `TAVILY_API_KEY`, and `POLLINATIONS_API_KEY` in Vercel server-side environment variables.
- Use Supabase Row Level Security for user-owned database records.
- Never commit `.env`, service-role keys, access tokens, or user data.
- The Supabase publishable key is intended for client use; it is not a substitute for Row Level Security.
- Owner-only endpoints verify the authenticated user's email on the server.

## Project layout

```text
api/                 Vercel API handlers and shared server utilities
public/              Static assets, manifest, offline page and service worker
src/                 React application
tests/               Node.js test files
server.ts            Local Express development server
vite.config.ts       Vite configuration
```

## Contributing

Keep changes focused, add or update regression tests for behavior changes, and run:

```bash
npm test
npm run lint
npm run build
```

Do not mark a release as production-ready until the test suite, TypeScript check, and production build have completed successfully.
