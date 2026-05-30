# AIchitect — Scope Rule

AIchitect maps the **AI layer** of a software product. Nothing more, nothing less.

This document is the rule that admission decisions flow from. When you're unsure whether a tool belongs in the catalog, the rule here decides — not taste, not "it's adjacent enough."

## The rule

A tool earns a catalog entry if it satisfies **one** of these:

1. **AI-native** — built around an LLM or ML model as the core abstraction.
   The tool's reason to exist is AI.
2. **AI-required substrate** — a protocol, contract, or schema layer that AI workflows depend on and that the AI community has driven adoption of.
   The tool may predate AI but its current relevance is AI-shaped.

A tool is **out** if it's general-purpose infrastructure used by AI but also by everything else.

The line: did AI cause this tool's relevance, or was it relevant anyway?

## Tool scope tag

Every tool carries a `scope` field:

- `ai-native` — fits criterion (1).
- `substrate` — fits criterion (2). Rendered with a small "substrate" visual marker so users understand the distinction.

There is no third category. Anything that doesn't fit one of the two doesn't enter the catalog.

## Examples

**IN — `ai-native`:** Cursor, Claude Code, Windsurf, LangGraph, LangChain, LlamaIndex, Qdrant, Pinecone, Langfuse, Langsmith, OpenAI API, Anthropic API, Mem0, Letta, Composio, Browser Use, ElevenLabs, Vapi.

**IN — `substrate`:** Swagger / OpenAPI (used to ground LLM coding), MCP SDKs (TypeScript + Python), FastMCP, AGENTS.md, Mermaid (LLM-generated diagrams), Speakeasy.

**OUT:** Vercel, Railway, Render, Fly.io, Cloudflare Workers, GitHub Actions, CircleCI, Supabase, Neon, Planetscale, Postgres, Redis, Datadog, Sentry-the-platform.

These are excellent tools — they're just not what AIchitect maps.

## Non-goal

AIchitect does **not** tell you:

- Where to deploy your AI product
- Which CI / CD system to use
- Which app database or cache to run
- Which APM / log aggregation to wire up

These choices belong with your engineering org. AIchitect's job is to make the AI layer of that stack picked well — substrate up.

This is signposted on the landing page, on `/stacks`, and on the Builder result panel so the scope is never implicit.

## What counts as "the AI layer"

The catalog is organized around **12 lifecycle phases** that span the full AI product lifecycle. Two tracks weave through them:

| Phase              | Dev workflow | Runtime arch |
| ------------------ | ------------ | ------------ |
| `requirements`     | ●            |              |
| `specs`            | ●            |              |
| `design`           | ●            |              |
| `coding`           | ●            |              |
| `code-review`      | ●            |              |
| `providers`        |              | ●            |
| `orchestration`    |              | ●            |
| `retrieval-memory` |              | ●            |
| `tools-mcp`        |              | ●            |
| `guardrails`       |              | ●            |
| `eval`             | ●            | ●            |
| `observability`    | ●            | ●            |

`eval` and `observability` deliberately span both tracks — the same tools serve dev and prod contexts.

A stack carries a `track` (`development | runtime | specialized`) and a list of `phases` it covers. End-to-end stacks within either track are the headline curated paths.

## Borderline categories

Two categories sit close to the line. Decisions logged here so they don't drift:

- **AI-Augmented Code Quality** (formerly `devops`) — Graphite, Snyk, Sonarqube, Semgrep, Trunk, Pixee. These are not AI-native — they're code-quality tools that added AI features. We keep them under a narrowed label so the scope is honest.
- **Specifications** (`specifications`) — Swagger, Mermaid, OpenAPI Generator, AsyncAPI, Eraser, Redocly, Stoplight, Speakeasy, Fern, Stainless. These predate AI but are now the contract layer LLMs generate against. Tagged `scope: substrate` and kept.

Anything else that lives near the line — flag it in PR review against this document.

## Archived tools

Tools archived on GitHub are kept in the catalog with `archived: true`:

- Hidden from `/explore` default view.
- Detail page at `/tool/<id>` remains accessible so deep links don't 404.
- `/feed` exposes a "Show archived" toggle for history browsing.
- Relationships pointing to archived tools are pruned during the cleanup PR — archived tools are not re-linked.

## Editing this document

If the rule needs to evolve, change it here first, then propagate to:

- `CLAUDE.md` cross-link
- The "What's not here" copy on landing, `/stacks`, and Builder
- Any audit script that defends the boundary

Drift in this document = drift in the product.
