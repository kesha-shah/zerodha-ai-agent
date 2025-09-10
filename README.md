# zerodha-ai-agent

An AI-powered integration that connects Zerodha's MCP ecosystem with a Hugging Face LLM to enable natural-language portfolio insights and trading workflows. Built to showcase how MCP tools, LLM reasoning, and orchestrated prompts can make your investing experience more intuitive.

## Quickstart

Follow these steps to run the server locally:

1) Update environment variables

Add your Hugging Face API token to your `.env` file.

2) Install dependencies

```bash
npm install
```

3) Start the server

```bash
npm start
```

This will start the server on port 3000.

## Interact with your Zerodha Kite portfolio (via MCP + LLM)

Once the server is running, you can authenticate and chat in natural language about your portfolio.

### 1) Login to Kite

```bash
curl -s http://localhost:3000/auth/login
```

Copy the login URL from the response, paste it into your browser, and complete the login flow.

### 2) Ask AI questions about your portfolio

Example: get the total value for each stock in descending order.

```bash
curl -s -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Can you tell me total value for each stock in descending order"}'
```

The server will route your query through the LLM and MCP connectors to analyze your holdings and return an answer.

---

Built with love for AI, LLMs, and MCP-driven automation.

## How it works

High-level overview of the AI + LLM + MCP flow:

1) Server and endpoints

- Loads environment variables, connects to Zerodha MCP, and caches available MCP tools.
- Exposes endpoints: `GET /health`, `GET /mcp/tools`, `GET /auth/login`, `GET /auth/login/redirect`, and `POST /chat`.

2) MCP connection and tool catalog

- Establishes a Server-Sent Events (SSE) connection to Zerodha MCP using the `KITE_MCP_URL`.
- Fetches, caches, and serves the list of tools provided by MCP so the system can reason about available actions and their schemas.

3) LLM-based intent routing

- Builds a system prompt that enumerates the available MCP tools with their input schemas.
- Asks the LLM to make a strict JSON decision: either pick exactly one tool with arguments or decide that no tool is needed.
- Uses a natural-language chat endpoint to summarize results and answer user questions concisely.

4) Orchestration and safety

- Resolves the chosen tool name against the catalog (handles synonyms and fuzzy matching).
- Applies default values from the tool schema and validates required inputs before calling MCP.
- For sensitive actions (e.g.GTT operations), requires explicit user confirmation. If confirmation is pending, the API returns a `requires_confirmation` payload with the draft call.
- On authentication errors, automatically requests a login URL so you can authenticate and retry.
- After a tool call, asks the LLM to synthesize a clear, user-friendly answer based on your question and the tool result.

5) Endpoints you use

- `GET /auth/login`: returns a login URL (also available at `GET /auth/login/redirect` to open directly via 302).
- `POST /chat`: body includes `{ "message": string, "confirm": boolean }`. If a tool requires confirmation, call again with `confirm: true`.

6) Environment variables

- `HF_API_TOKEN` (required): Hugging Face API token for LLM.
- `LLM_PROVIDER` (optional): default `groq`.
- `LLM_MODEL` (optional): default `deepseek-ai/DeepSeek-R1-Distill-Llama-70B`.
- `KITE_MCP_URL` (required): Zerodha MCP SSE URL.
- `PORT` (optional): defaults to `3000`.

This design keeps the API thin, delegates portfolio and trading operations to MCP tools, and lets the LLM handle intent routing and response narration—combining MCP reliability with LLM flexibility.
